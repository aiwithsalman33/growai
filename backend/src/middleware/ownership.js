const prisma = require('../config/db');
const { ApiError } = require('./errorHandler');

/**
 * Role alone is not authorization: an agency user is allowed to touch GBP
 * accounts, but only *their* clients' accounts. Every route that takes a
 * gbpAccountId runs this so one tenant can never read or write another's data.
 *
 * Resolves the account onto `req.gbpAccount` so handlers don't refetch it.
 */
function resolveGbpAccount(source = 'params', key = 'gbpAccountId') {
  return async (req, res, next) => {
    try {
      const id = req[source]?.[key] || req.params.id;
      if (!id) throw new ApiError(400, `Missing ${key}`);

      const account = await prisma.gbpAccount.findUnique({ where: { id } });
      if (!account) throw new ApiError(404, 'GBP account not found');

      // Super admins operate across tenants for support.
      if (req.user.role !== 'super_admin' && account.ownerUserId !== req.user.id) {
        throw new ApiError(403, 'You do not have access to this GBP account');
      }

      req.gbpAccount = account;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Same guarantee for records that hang off an account (posts, reviews, photos).
 * `model` is the Prisma delegate name.
 */
function resolveOwnedRecord(model, paramName = 'id', attachAs = 'record') {
  return async (req, res, next) => {
    try {
      const id = req.params[paramName];
      const record = await prisma[model].findUnique({
        where: { id },
        include: { gbpAccount: true },
      });
      if (!record) throw new ApiError(404, 'Record not found');

      if (
        req.user.role !== 'super_admin' &&
        record.gbpAccount.ownerUserId !== req.user.id
      ) {
        throw new ApiError(403, 'You do not have access to this record');
      }

      req[attachAs] = record;
      req.gbpAccount = record.gbpAccount;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Accounts the caller may act on — used by list endpoints. */
async function accessibleAccountIds(user) {
  if (user.role === 'super_admin') return null; // null means "no filter"
  const accounts = await prisma.gbpAccount.findMany({
    where: { ownerUserId: user.id },
    select: { id: true },
  });
  return accounts.map((a) => a.id);
}

module.exports = { resolveGbpAccount, resolveOwnedRecord, accessibleAccountIds };
