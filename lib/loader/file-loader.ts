import { cosmiconfig, Options } from 'cosmiconfig';
import { parse as parseToml } from '@iarna/toml';
import { Config } from 'cosmiconfig/dist/types';

const loadToml = function loadYaml(filepath: string, content: string) {
  try {
    const result = parseToml(content);
    return result;
  } catch (error) {
    error.message = `TOML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

export interface FileLoaderOptions extends Partial<Options> {
  /**
   * Use given file directly, instead of recursively searching in directory tree.
   */
  absolutePath?: string;
  /**
   * The directory to search from, defaults to `process.cwd()`. See: https://github.com/davidtheclark/cosmiconfig#explorersearch
   */
  searchFrom?: string;
}

/**
 * File loader loads configuration with `cosmiconfig`.
 *
 * It is designed to be easy to use by default:
 *  1. Searching for configuration file starts at `process.cwd()`, and continues
 *     to search up the directory tree until it finds some acceptable configuration.
 *  2. Various extensions are supported, such as `.json`, `.yaml`, `.toml`, `.js` and `.cjs`.
 *  3. Configuration base name defaults to .env (so the full name is `.env.json` or `.env.yaml`),
 *     separate file for each environment is also supported. For example, if current `NODE_ENV` is
 *     development, `.env.development.json` has higher priority over `.env.json`.
 *
 * @see https://github.com/davidtheclark/cosmiconfig
 * @param options cosmiconfig initialize options. See: https://github.com/davidtheclark/cosmiconfig#cosmiconfigoptions
 */
export const fileLoader = (options: FileLoaderOptions = {}) => {
  return async (): Promise<Config> => {
    const formats = ['toml', 'yaml', 'yml', 'json', 'js'];
    const searchPlaces = options.absolutePath
      ? [options.absolutePath]
      : [
          ...formats.map(format => `.env.${process.env.NODE_ENV}.${format}`),
          ...formats.map(format => `.env.${format}`),
        ];
    const loaders = {
      '.toml': loadToml,
      ...options.loaders,
    };
    const explorer = cosmiconfig('env', {
      searchPlaces,
      ...options,
      loaders,
    });
    const result = await explorer.search(options.searchFrom);

    if (!result) {
      throw new Error(`Failed to find configuration file.`);
    }
    return result.config;
  };
};