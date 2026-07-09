// El paquete `expo` ya se autolinkea via expo-modules-autolinking (v2).
// El autolinking "community" de React Native no debe intentar
// autoregistrarlo tambien: lo hace con una ruta de clase obsoleta
// (expo.core.ExpoModulesPackage) que ya no existe, causando el build
// error "cannot find symbol: class ExpoModulesPackage" en EAS.
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: null,
      },
    },
  },
};
