import { userRepository, refreshTokenRepository } from './auth.repository.js';
import {
  signAccessToken,
  newRefreshToken,
  hashRefreshToken,
  refreshExpiry,
  verifyAccessToken,
} from '../../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from 'shared/errors';

async function issueTokenPair(user, { parentJti = null } = {}) {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  });
  const refreshToken = newRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = refreshExpiry();

  await refreshTokenRepository.insert({
    tokenHash,
    userId: user._id,
    expiresAt,
    parentJti,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register({ email, password, name, role = 'customer' }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const user = await userRepository.create({ email, password, name, role });
    const tokens = await issueTokenPair(user);
    return { user: user.toJSON(), ...tokens };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    // identical error for wrong-email and wrong-password (no user enumeration)
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const tokens = await issueTokenPair(user);
    return { user: user.toJSON(), ...tokens };
  },

  async refresh(refreshToken) {
    const hash = hashRefreshToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(hash);
    if (!stored) throw new UnauthorizedError('Invalid refresh token');
    if (stored.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired');

    await refreshTokenRepository.revoke(stored._id);

    const user = await userRepository.findById(stored.userId);
    if (!user) throw new NotFoundError('User');

    const tokens = await issueTokenPair(user, { parentJti: stored._id.toString() });
    return tokens;
  },

  async logout(refreshToken) {
    const hash = hashRefreshToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(hash);
    if (stored) await refreshTokenRepository.revoke(stored._id);
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user.toJSON();
  },

  verifyAccessToken,
};
