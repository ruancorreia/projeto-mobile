# Gabaritos por livro

Cada livro fica em um arquivo com o codigo do livro:

- `081.ts`
- `082.ts`
- `083.ts`

## Como adicionar um novo livro

1. Copie `src/gabarito/_template.ts` para `src/gabarito/XYZ.ts`.
2. Preencha os 5 programas com as 30 questoes de cada programa.
3. Abra `src/gabarito/index.ts`.
4. Importe o novo gabarito:

```ts
import { GABARITO_PENSE_BEM as GABARITO_082 } from "./082";
```

5. Registre no mapa:

```ts
const GABARITOS_POR_LIVRO: Record<string, GabaritoPenseBem> = {
  "081": GABARITO_081,
  "082": GABARITO_082,
};
```

Pronto. O app passa a aceitar o novo codigo sem alterar `App.tsx`.
