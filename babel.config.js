module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@icons': './src/assets/icons',
          '@images': './src/assets/img',
          '@constants': './src/constants',
          '@components': './src/components',
          '@graphql': './src/graphql',
          '@store': './src/store',
          '@screens': './src/screens',
          '@styles': './src/styles',
          '@utils': './src/utils',
          '@icons/*': './src/assets/icons/*',
          '@navigation': './src/navigation',
          '@src': './src/App',
          '@context': './src/context',
          '@types': './src/types',
          '@base': './src/base',
        },
      },
    ],
  ],
};
