import js from '@eslint/js'
import vueTsConfig from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'coverage'] },
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    ...vueTsConfig(),
    prettier,
    {
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },
)
