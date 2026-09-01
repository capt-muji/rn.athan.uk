const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

const withGradleJvmMemory = (config) => {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const jvmArgs = properties.find((entry) => entry.key === 'org.gradle.jvmargs');

    if (jvmArgs) {
      jvmArgs.value = JVM_ARGS;
    } else {
      properties.push({ key: 'org.gradle.jvmargs', value: JVM_ARGS });
    }

    return config;
  });
};

module.exports = withGradleJvmMemory;
