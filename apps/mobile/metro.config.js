const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;

// disableHierarchicalLookup (removido) bloqueaba a Metro de subir por el
// arbol de carpetas para resolver paquetes anidados de pnpm (asi se rompio
// @expo/metro-runtime, expo-modules-core, y ahora 'invariant' — cada uno
// requerido internamente por expo/react-native, ninguno importado directo
// por nuestro codigo). Con lookup jerarquico normal, Metro encuentra esos
// paquetes solo, como pnpm los instalo, sin tener que declarar cada uno
// como dependencia directa uno por uno.
//
// El problema real que disableHierarchicalLookup intentaba resolver era
// distinto: paquetes compartidos del workspace (ej. @gymapp/shared-types,
// sin node_modules propio) podian subir hasta el node_modules de la raiz
// del repo y encontrar ahi una copia ambigua/equivocada de react (la de
// web, React 19), causando el crash de pantalla blanca. La solucion
// correcta es forzar SOLO la resolucion de react/react-dom/react-native
// a la copia de este workspace (mobile, React 18) — no bloquear la
// busqueda jerarquica para todo lo demas.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

module.exports = config;
