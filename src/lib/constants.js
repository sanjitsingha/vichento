// Single source of truth for topics. The editor, explore page, feed and
// profile interests must all use the same spelling, otherwise category
// filters (`overlaps("categories", ...)`) never match.
export const CATEGORIES = [
  "Technology",
  "AI",
  "Startups",
  "Business",
  "Programming",
  "Design",
  "Productivity",
  "Finance",
  "Marketing",
  "Health",
  "Career",
  "Sports",
  "Science",
  "Writing",
];

export const DEFAULT_AVATAR = "/default-avatar.jpg";
export const IMAGE_PLACEHOLDER = "/vichento-image-placeholder.png";
export const SUPPORT_EMAIL = "write.vichento@gmail.com";
