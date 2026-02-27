export default {
  privateDirectoryUrl: 'http://simple-directory:8080',
  privateEventsUrl: undefined,
  mongoUrl: 'mongodb://localhost:27017/data-fair-agents',
  port: 8080,
  tmpDir: '/tmp',
  observer: {
    active: true,
    port: 9090
  },
  secretKeys: {
    admin: undefined
  },
  upgradeRoot: '/app/'
}
