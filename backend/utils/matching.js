export const normalizeSkills = (skills = []) =>
  skills
    .map((skill) => (typeof skill === "string" ? skill : skill?.name))
    .filter(Boolean)
    .map((skill) => skill.trim().toLowerCase());

export const skillSimilarity = (gigSkills = [], freelancerSkills = []) => {
  const required = new Set(normalizeSkills(gigSkills));
  const available = new Set(normalizeSkills(freelancerSkills));
  if (!required.size) return 0;

  let matches = 0;
  required.forEach((skill) => {
    if (available.has(skill)) matches += 1;
  });

  return Math.round((matches / required.size) * 100);
};

export const getMatchScore = (gig, freelancer) => {
  const skillsScore = skillSimilarity(gig.skills, freelancer.skills);
  const locationScore =
    gig.location &&
    freelancer.location &&
    gig.location.toLowerCase() === freelancer.location.toLowerCase()
      ? 15
      : 0;
  const badgeScore = freelancer.verificationBadge ? 10 : 0;
  return Math.min(100, skillsScore + locationScore + badgeScore);
};
