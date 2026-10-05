module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/prototype/', '/supabase/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
