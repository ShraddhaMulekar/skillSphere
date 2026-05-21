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

export const getEmailValidationError = (email) => {
  const normalized = String(email || "").trim().toLowerCase();

  if (!normalized) return "Email is required";
  if (!EMAIL_REGEX.test(normalized)) return "Please enter a valid email address";

  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain) return "Please enter a valid email address";
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return "Disposable email addresses are not allowed. Please use a real email address.";
  }
  if (BLOCKED_DOMAINS.includes(domain)) {
    return "Dummy or test email domains are not allowed. Please use a real email address.";
  }
  if (DUMMY_LOCAL_PARTS.includes(localPart) || /^test\d*$/.test(localPart) || /^dummy\d*$/.test(localPart)) {
    return "Dummy email addresses are not allowed. Please use your real email address.";
  }

  return "";
};

export const isDisposableEmail = (email) => {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
};
