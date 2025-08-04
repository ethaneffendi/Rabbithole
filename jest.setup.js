global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
  },
  sidePanel: {
    setOptions: jest.fn(),
    setPanelBehavior: jest.fn(),
  },
  tabs: {
    onActivated: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
    onCreated: {
      addListener: jest.fn(),
    },
    query: jest.fn(),
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
};