const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "mailinator.com",
  "guerrillamail.com",
  "yopmail.com",
  "10minutemail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "fakeinbox.com",
  "temp-mail.org",
  "maildrop.cc",
  "dispostable.com",
];

const BLOCKED_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.in",
  "dummy.com",
  "dummy.in",
  "fake.com",
  "fake.in",
  "localhost",
  "gmail.co",
  "gamil.com",
  "gmial.com",
  "yaho.com",
  "hotmial.com",
  "outlok.com",
];

const DUMMY_LOCAL_PARTS = [
  "test",
  "dummy",
  "fake",
  "admin",
  "user",
  "abc",
  "abcd",
  "asdf",
  "qwerty",
  "demo",
  "sample",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVALID_EMAIL_MESSAGE = "email id not found or valid";

export const getEmailValidationError = (email) => {
  const normalized = String(email || "").trim().toLowerCase();

  if (!normalized) return INVALID_EMAIL_MESSAGE;
  if (!EMAIL_REGEX.test(normalized)) return INVALID_EMAIL_MESSAGE;

  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain) return INVALID_EMAIL_MESSAGE;
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return INVALID_EMAIL_MESSAGE;
  }
  if (BLOCKED_DOMAINS.includes(domain)) {
    return INVALID_EMAIL_MESSAGE;
  }
  if (DUMMY_LOCAL_PARTS.includes(localPart) || /^test\d*$/.test(localPart) || /^dummy\d*$/.test(localPart)) {
    return INVALID_EMAIL_MESSAGE;
  }

  return "";
};

export const isDisposableEmail = (email) => {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
};
