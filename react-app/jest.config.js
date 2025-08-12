module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!src/reportWebVitals.js"
  ],
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "text",
    "lcov",
    "html"
  ],
  
  // The test environment that will be used for testing
  setupFilesAfterEnv: [
    "<rootDir>/src/setupTests.js"
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // The maximum amount of workers used to run your tests
  maxWorkers: "50%",
  
  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    "node_modules",
    "src"
  ],
  
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapping: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js"
  },
  
  // An array of file extensions your modules use
  moduleFileExtensions: [
    "js",
    "json",
    "jsx"
  ],
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx}"
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // This option sets the URL for the jsdom environment
  testURL: "http://localhost",
  
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true
}; 