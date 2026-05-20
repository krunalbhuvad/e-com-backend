import { User } from './auth.model.js';
import { RefreshToken } from './refresh-token.model.js';

export const userRepository = {
  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  },
  findById(id) {
    return User.findById(id);
  },
  async create({ email, password, name, role }) {
    const user = new User({ email, name, role });
    user.password = password;
    await user.save();
    return user;
  },
};

export const refreshTokenRepository = {
  insert(doc) {
    return RefreshToken.create(doc);
  },
  findByHash(hash) {
    return RefreshToken.findOne({ tokenHash: hash, revokedAt: null });
  },
  revoke(id) {
    return RefreshToken.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
  },
  revokeAllForUser(userId) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  },
};
