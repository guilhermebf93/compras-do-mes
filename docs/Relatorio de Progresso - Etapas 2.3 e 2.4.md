# Compras do Mês --- Relatório de Progresso

**Etapas:** 2.3 --- Registro de estoque inicial; 2.4 --- Reposição de
estoque\
**Status:** Concluídas\
**Data de conclusão:** 22/11/2026

------------------------------------------------------------------------

## 1. Resumo executivo

Neste ciclo, foram concluídas duas subetapas do controle de estoque do
Compras do Mês.

A etapa 2.3 integrou o estoque inicial ao cadastro de produtos,
garantindo que a quantidade informada seja convertida para a
unidade-base, registrada no histórico como `INITIAL_STOCK` e refletida
em `Product.currentStock`.

A etapa 2.4 implementou a reposição de estoque a partir da quantidade de
embalagens. A operação calcula o acréscimo na unidade-base, atualiza o
saldo e registra uma movimentação `RESTOCK`, mantendo a consistência
entre o saldo atual e o histórico.

As duas operações utilizam transações Prisma. Na etapa 2.4, também foram
implementadas proteções contra reposição de produtos arquivados,
quantidades inválidas, estouro do limite de `Decimal(12,3)` e
atualizações que ultrapassem o limite do estoque.

**Resultado:** as etapas 2.3 e 2.4 foram concluídas. A etapa 2.4 passou
pelos cinco cenários funcionais definidos durante esta conversa.

## 2. Arquitetura e regras de dados preservadas

As implementações utilizaram os modelos existentes no schema Prisma, sem
necessidade de criar novos modelos ou realizar migrations para essas
funcionalidades.

### Product

O produto mantém o saldo atual em `currentStock`, além das informações
de embalagem e unidade:

-   `packageUnit`: unidade informada para a embalagem.
-   `packageQuantity`: quantidade de uma embalagem, armazenada na
    unidade-base.
-   `baseUnit`: unidade-base do produto.
-   `currentStock`: saldo atual na unidade-base.
-   `lastStockCountAt`: data da última conferência física do estoque.
-   `isActive`: situação do produto.

### StockMovement

O histórico utiliza o modelo `StockMovement` e os tipos já definidos no
enum `StockMovementType`:

-   `INITIAL_STOCK`: estoque informado no cadastro.
-   `RESTOCK`: entrada por reposição.
-   `CONSUMPTION`: saída por consumo.
-   `ADJUSTMENT`: correção de estoque.

A regra consolidada continua sendo:

**Nenhuma alteração de estoque deve ocorrer sem a movimentação
correspondente.**

As operações que alteram o saldo e criam o movimento devem acontecer na
mesma transação. Se uma das operações falhar, a transação deve ser
revertida.

## 3. Etapa 2.3 --- Registro de estoque inicial

### 3.1 Objetivo

Integrar a quantidade inicial ao cadastro do produto, permitindo que o
usuário informe quanto já possui em estoque no momento em que cadastra o
produto.

### 3.2 Implementação

O formulário de produto passou a oferecer o campo de estoque inicial,
identificado por `initialStock`.

A quantidade é informada utilizando a unidade da embalagem. Antes de
persistir o valor, ela é convertida para a unidade-base com
`convertToBaseUnit()`.

A criação do produto e o registro do estoque inicial são realizados
dentro de uma transação Prisma.

Fluxo implementado:

1.  Autenticar o usuário com `getAuthenticatedUser()`.
2.  Validar os dados recebidos pelo `createProductSchema`.
3.  Converter o estoque inicial para a unidade-base.
4.  Criar o produto com `currentStock` inicialmente zerado.
5.  Se o estoque inicial for maior que zero, criar um movimento
    `INITIAL_STOCK`.
6.  Atualizar `Product.currentStock` com a quantidade inicial
    convertida.
7.  Confirmar as operações na mesma transação.
8.  Revalidar a listagem e redirecionar para `/produtos`.

Quando o estoque inicial é zero, não é criado um movimento
`INITIAL_STOCK` desnecessário.

### 3.3 Conversão de unidades

A quantidade inicial é convertida com a função centralizada
`convertToBaseUnit()`, que utiliza `Prisma.Decimal`.

Exemplo conceitual: se a embalagem for cadastrada em quilogramas, o
estoque inicial informado nessa unidade é convertido para gramas antes
de ser armazenado.

`packageQuantity` e `currentStock` permanecem armazenados na
unidade-base. Isso mantém os cálculos posteriores consistentes,
independentemente da unidade escolhida para a embalagem.

### 3.4 Consistência do estoque

A criação do produto, o registro de `INITIAL_STOCK` e a atualização do
saldo são transacionais.

O produto começa com `currentStock` igual a zero e recebe o saldo
inicial por meio da operação correspondente, evitando que o saldo seja
atualizado sem histórico.

### 3.5 Estado da etapa

A etapa 2.3 foi concluída e serviu de base para as operações seguintes
de movimentação de estoque.

Não foram registrados nesta conversa detalhes suficientes para enumerar
cenários específicos de testes funcionais da etapa 2.3; por isso, este
relatório documenta a implementação e as regras confirmadas, sem
atribuir testes não descritos.

## 4. Etapa 2.4 --- Reposição de estoque

### 4.1 Decisão de experiência e escopo

O planejamento original previa avaliar a entrada por quantidade de
embalagens ou diretamente na unidade-base. Para a implementação inicial
da etapa 2.4, foi adotado o fluxo por **quantidade inteira de
embalagens**.

O usuário informa quantas embalagens comprou, e a aplicação calcula a
quantidade a acrescentar ao estoque.

Não foi implementada nesta etapa uma segunda modalidade de reposição por
quantidade digitada diretamente na unidade-base.

### 4.2 Regra de cálculo

`packageQuantity` já está armazenado na unidade-base. Portanto, não deve
ser convertido novamente durante a reposição.

A regra implementada é:

``` text
quantidade adicionada = packageQuantity × quantidade de embalagens
novo estoque = currentStock + quantidade adicionada
```

Exemplo: para uma embalagem de 1.000 gramas, a reposição de cinco
embalagens acrescenta 5.000 gramas ao estoque.

Os cálculos persistidos utilizam `Prisma.Decimal`, evitando depender de
operações com ponto flutuante para atualizar o banco.

### 4.3 Validação

O schema `restockSchema`, em `src/lib/validations/stock.schema.ts`,
valida `packageCount` como texto numérico inteiro positivo e o
transforma em número.

Foi acrescentada a validação `Number.isSafeInteger` para rejeitar
inteiros que ultrapassem a faixa de representação segura do JavaScript.

O formulário também oferece restrições visuais com `type="number"`,
`min={1}` e `step={1}`. Essas restrições melhoram a experiência, mas a
validação do servidor continua sendo a proteção efetiva da operação.

### 4.4 Server Action `restockProduct`

A reposição foi implementada em `src/lib/products/actions.ts`, seguindo
o padrão de Server Actions existente.

Fluxo da operação:

1.  Recuperar o usuário autenticado com `getAuthenticatedUser()`.
2.  Validar o UUID do produto.
3.  Validar `packageCount` com `restockSchema`.
4.  Iniciar uma transação Prisma.
5.  Localizar o produto pelo ID, pelo `userId` do usuário autenticado e
    com `isActive: true`.
6.  Calcular a quantidade a adicionar utilizando
    `packageQuantity.mul(packageCount)`.
7.  Verificar o limite máximo permitido.
8.  Atualizar `currentStock` com incremento condicional.
9.  Criar o movimento `RESTOCK` com a quantidade adicionada.
10. Revalidar `/produtos` e `/produtos/[id]`.

A ação não confia em `userId` enviado pelo cliente. A propriedade é
determinada no servidor.

Produtos arquivados não podem receber reposições. Essa regra é aplicada
tanto na interface quanto na Server Action.

### 4.5 Resultado interno da transação

Foi adotado um tipo auxiliar `RestockTransactionResult` para tipar o
resultado da transação, separando-o do estado público da Server Action
(`ProductActionState`).

O `updateMany` continua retornando o tipo próprio do Prisma
(`Prisma.BatchPayload`); o resultado da transação é que utiliza
`RestockTransactionResult`.

Essa separação deixa claras três responsabilidades:

-   Resultado do `updateMany`: quantidade de registros atualizados.
-   Resultado da transação: sucesso ou motivo de falha da operação.
-   `ProductActionState`: mensagem e erros apresentados pelo formulário.

### 4.6 Limite de estoque e concorrência

O campo `currentStock` utiliza `Decimal(12,3)`. O limite máximo
representável é:

``` text
999999999.999
```

A implementação calcula o acréscimo com `Prisma.Decimal` e utiliza uma
atualização condicional com `updateMany`, verificando se o saldo atual
comporta o incremento sem ultrapassar o limite.

Essa condição é aplicada na própria operação de atualização, protegendo
também contra tentativas simultâneas de reposição que ultrapassem o
limite.

Se a atualização condicional não modificar o produto, a transação não
cria o movimento `RESTOCK`.

### 4.7 Histórico e data da última conferência

Cada reposição cria um movimento com:

-   `type`: `RESTOCK`.
-   `quantity`: quantidade adicionada, na unidade-base.
-   `intervalStartAt`: `null`.

A reposição não altera `lastStockCountAt`.

**Decisão:** reposição representa uma entrada de estoque, não uma
conferência física. A data de última conferência deve continuar
representando a última vez em que o usuário verificou fisicamente o
estoque.

A reposição também não registra consumo nem interfere no cálculo de
consumo.

## 5. Interface da reposição

Foi criado o componente:

`src/components/products/restock-form.tsx`

O componente é um Client Component porque precisa controlar a quantidade
informada e atualizar a prévia em tempo real.

### 5.1 Integração com Server Action

O formulário utiliza `useActionState` e associa o ID do produto à action
com `restockProduct.bind(null, productId)`.

O estado utiliza `ProductActionState`, incluindo a propriedade `success`
para diferenciar mensagens de sucesso e erro.

### 5.2 Prévia do cálculo

Enquanto a quantidade informada for um inteiro positivo, o formulário
apresenta:

-   Quantidade a adicionar.
-   Novo estoque estimado.

A prévia é calculada no cliente para orientar o usuário. O cálculo
definitivo e a atualização persistida continuam sendo realizados no
servidor com `Prisma.Decimal`.

### 5.3 Experiência de envio

O fluxo visual implementado:

1.  O usuário informa a quantidade de embalagens.
2.  A prévia apresenta o acréscimo e o novo saldo.
3.  Ao enviar, o botão é desabilitado e exibe `Registrando...`.
4.  Em caso de sucesso, o campo é limpo e a prévia desaparece.
5.  O botão retorna ao rótulo `Registrar`, permanecendo desabilitado
    enquanto o campo estiver vazio.
6.  A mensagem de sucesso é exibida.

Em caso de falha, a quantidade permanece preenchida, permitindo ao
usuário entender e corrigir a operação.

A limpeza do campo foi implementada na função intermediária passada ao
`useActionState`, após o retorno bem-sucedido da Server Action. Não foi
utilizado `useEffect`, pois a atualização do estado decorre diretamente
do resultado da ação do formulário.

### 5.4 Estilos

Foram reaproveitadas as classes globais existentes no `globals.scss`,
incluindo:

-   `.form`
-   `.form-field`
-   `.field-label`
-   `.field-error`
-   `.alert`
-   `.alert--success`
-   `.alert--error`
-   `.button`
-   `.button--primary`

Foi criado `restock-form.module.scss` para os estilos específicos da
prévia, mantendo os estilos particulares separados dos estilos globais.

A prévia apresenta as linhas de quantidade adicionada e novo estoque em
uma área visual própria, com destaque discreto para o saldo resultante.

### 5.5 Integração à página de detalhes

O formulário foi integrado à seção Estoque da página:

`src/app/(protected)/produtos/[id]/page.tsx`

A seção continua exibindo o saldo e a data da última conferência.

O formulário aparece somente quando `product.isActive` é verdadeiro.
Produtos arquivados continuam permitindo consulta ao estoque, mas não
exibem a funcionalidade de reposição.

## 6. Testes funcionais da etapa 2.4

Foram executados cinco cenários funcionais.

### Teste 1 --- Reposição válida

**Resultado: aprovado.**

Foi realizada uma reposição de cinco embalagens, com acréscimo de 5.000
gramas.

Foram conferidos:

-   Atualização de `Product.currentStock`.
-   Criação do movimento `RESTOCK`.
-   Quantidade registrada de 5.000.
-   `intervalStartAt` igual a `null`.
-   Preservação de `lastStockCountAt`.

Durante a primeira execução, o formulário não limpou o campo porque a
condição estava invertida (`!result.success`). A condição foi corrigida
para limpar o campo somente quando `result.success` for verdadeiro.

O teste foi repetido e passou. A atualização do estoque e o registro dos
movimentos foram confirmados no banco.

### Teste 2 --- Reposição múltipla

**Resultado: aprovado.**

Com estoque anterior de 11.000 gramas:

-   Primeira reposição: duas embalagens, acrescentando 2.000 gramas.
-   Segunda reposição: três embalagens, acrescentando 3.000 gramas.

Resultado esperado e observado:

-   Saldo final de 16.000 gramas.
-   Dois novos movimentos `RESTOCK`.
-   Quantidades correspondentes a 2.000 e 3.000 gramas.

O teste confirmou o acúmulo correto de reposições sucessivas.

### Teste 3 --- Validação de quantidade

**Resultado: aprovado.**

Foram verificadas as entradas:

  Entrada       Comportamento esperado e observado
  ------------- ------------------------------------
  Campo vazio   Botão desabilitado
  `0`           Botão desabilitado
  `-1`          Botão desabilitado
  `1,5`         Botão desabilitado
  `2`           Botão habilitado

O comportamento do botão e as restrições da interface corresponderam ao
esperado.

### Teste 4 --- Produto arquivado

**Resultado: aprovado.**

Após arquivar um produto:

-   A seção Estoque continuou visível.
-   O saldo continuou disponível para consulta.
-   O formulário de reposição desapareceu.
-   O estoque no banco permaneceu inalterado.
-   Os movimentos existentes permaneceram inalterados.

A proteção da Server Action também exige `isActive: true`, impedindo
reposição de produto arquivado mesmo que a interface seja contornada.

### Teste 5 --- Limite máximo do estoque

**Resultado: aprovado.**

Foi preparado um produto de teste com estoque próximo ao limite de
`Decimal(12,3)`.

O estoque chegou a:

``` text
999999999.999
```

Em seguida, foi tentada uma reposição adicional de 1.000 gramas.

Comportamento observado:

-   A operação foi rejeitada.
-   A mensagem de limite excedido foi apresentada.
-   O estoque permaneceu em `999999999.999`.
-   O formulário manteve a quantidade informada.
-   Nenhum movimento adicional foi criado.

Após o teste, foi realizada a limpeza dos dados artificiais utilizados,
evitando deixar o produto de teste com estoque fictício.

## 7. Validação técnica

Durante a implementação e os ajustes do formulário, foram executados:

``` bash
npx tsc --noEmit
npm run lint
```

**Resultados informados:**

-   TypeScript aprovado.
-   ESLint aprovado.

Também foi corrigido um aviso de lint relacionado à chamada de
`setState` dentro de `useEffect`. A limpeza do campo passou a acontecer
na função intermediária do `useActionState`, condicionada ao sucesso da
Server Action.

## 8. Decisões e padrões consolidados

As decisões abaixo devem ser preservadas nas próximas subetapas:

-   O saldo atual é mantido em `Product.currentStock`.
-   O histórico é mantido em `StockMovement`.
-   Nenhuma alteração de estoque deve ocorrer sem movimento
    correspondente.
-   Operações de saldo e histórico devem ser transacionais.
-   `packageQuantity` e `currentStock` são armazenados na unidade-base.
-   Conversões e cálculos persistidos utilizam `Prisma.Decimal`.
-   Reposição é registrada como `RESTOCK`.
-   Estoque inicial é registrado como `INITIAL_STOCK`.
-   `intervalStartAt` é reservado para o intervalo observado em
    movimentações de consumo; reposições usam `null`.
-   Reposição não altera `lastStockCountAt`.
-   Reposição não deve interferir no cálculo de consumo.
-   Produtos arquivados preservam saldo e histórico, mas não podem
    receber reposições.
-   A autenticação e a propriedade dos registros são verificadas no
    servidor.
-   A interface pode apresentar prévias, mas o servidor é responsável
    pela validação e pelo cálculo definitivo.

## 9. Estado atual das subetapas

### Etapa 2.3 --- Registro de estoque inicial

-   [x] Receber a quantidade inicial no cadastro.
-   [x] Converter a quantidade para unidade-base.
-   [x] Criar o produto.
-   [x] Registrar `INITIAL_STOCK` quando houver estoque positivo.
-   [x] Atualizar `currentStock`.
-   [x] Executar as operações em transação Prisma.

### Etapa 2.4 --- Reposição de estoque

-   [x] Informar quantidade inteira de embalagens.
-   [x] Calcular o acréscimo na unidade-base.
-   [x] Registrar movimentação `RESTOCK`.
-   [x] Atualizar `currentStock`.
-   [x] Impedir reposição de produtos arquivados.
-   [x] Validar quantidade inteira positiva.
-   [x] Proteger o limite de `Decimal(12,3)`.
-   [x] Preservar `lastStockCountAt`.
-   [x] Não interferir no cálculo de consumo.
-   [x] Implementar prévia do novo saldo.
-   [x] Implementar estados de carregamento e feedback.
-   [x] Testar reposição válida.
-   [x] Testar reposições sucessivas.
-   [x] Testar validação de quantidade.
-   [x] Testar produto arquivado.
-   [x] Testar limite máximo e ausência de movimento indevido.
-   [x] Limpar os dados artificiais do teste de limite.
-   [x] TypeScript aprovado.
-   [x] ESLint aprovado.

## 10. Próxima etapa de desenvolvimento

A próxima subetapa será:

**Etapa 2.5 --- Ajustes de estoque**

Conforme o planejamento original, deverá contemplar:

1.  Permitir aumentar o estoque.
2.  Permitir diminuir o estoque.
3.  Registrar movimentação `ADJUSTMENT`.
4.  Impedir que o saldo fique negativo.
5.  Distinguir um ajuste de estoque de um consumo real.

A implementação deverá preservar as regras já estabelecidas para
transações, precisão decimal, histórico de movimentações e propriedade
dos registros.

------------------------------------------------------------------------

## Conclusão

As etapas 2.3 --- Registro de estoque inicial e 2.4 --- Reposição de
estoque estão concluídas.

O Compras do Mês agora permite iniciar o controle de estoque no cadastro
e registrar novas entradas por reposição, mantendo o saldo e o histórico
sincronizados.

A implementação preserva a arquitetura existente, utiliza os modelos já
definidos no Prisma e passou pelos cenários funcionais previstos para a
reposição.

**O projeto está pronto para avançar para a etapa 2.5 --- Ajustes de
estoque.**
