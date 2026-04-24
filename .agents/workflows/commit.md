---
description: >
  Procedimento para criar commits seguindo as convenções do projeto.
  Usar quando quiser fazer commit das alterações staged no repositório.
  Gera mensagem de commit em Conventional Commits, Português-BR, com escopo
  obrigatório, e apresenta para aprovação antes de executar.
  Suporta modo direto (sem interações) quando o usuário solicitar.
---

# Commit no Repositório

## Modo Direto

Quando o usuário indicar que é um **commit direto** (ex: "commit direto", "direto"), executar o fluxo completo **sem interações**:

1. Atualizar wiki se aplicável (passo 1.5 — executar silenciosamente).
2. Se nada estiver staged, executar `git add .` automaticamente (sem perguntar).
3. Analisar o diff e gerar a mensagem de commit.
4. Executar o commit imediatamente (sem pedir aprovação).
5. Executar `git push` automaticamente (sem perguntar).
6. Informar o resultado final ao usuário.

Os passos abaixo se aplicam ao **modo normal** (com interações). No modo direto, seguir as simplificações indicadas em cada passo.

## Passos

### 1. Verificar o que está staged

// turbo
```bash
git diff --cached --stat
```

Se houver arquivos staged, prosseguir para o passo 2.

Se **nada** estiver staged, verificar alterações não-staged:

// turbo
```bash
git status --short
```

**Modo direto:** executar `git add .` automaticamente e prosseguir.

**Modo normal:** apresentar a lista ao usuário e perguntar:

```
Nenhum arquivo está staged. Os seguintes arquivos foram modificados:

  <lista de arquivos>

Deseja fazer stage de todos (git add .), de arquivos específicos, ou cancelar?
```

Aguardar a resposta do usuário:
- **Todos:** executar `git add .`
- **Específicos:** executar `git add <arquivos indicados>`
- **Cancelar:** encerrar o workflow

Se não houver nenhuma alteração (staged ou não), informar e encerrar.

### 1.5. Atualizar wiki (se aplicável)

Avaliar se a sessão produziu conhecimento relevante, conforme critérios de `.agents/rules/wiki-maintenance.md`:
- Decisões arquiteturais ou trade-offs
- Correções de bugs não-triviais
- Novos padrões, convenções ou refatorações
- Mudanças em specs, APIs ou contratos públicos

Se aplicável:
1. Ler `.agents/wiki/index.md` para identificar páginas existentes
2. Atualizar as páginas afetadas ou criar novas
3. Atualizar o `index.md` se novas páginas foram criadas
4. As mudanças no wiki serão incluídas no stage junto com o código

Se a sessão foi puramente cosmética (formatação, typos) ou não produziu conhecimento novo, pular este passo.

### 2. Analisar as alterações staged

// turbo
```bash
git diff --cached
```

**Escopo de contexto:** basear a análise **exclusivamente** no diff staged acima.
Não considerar outras alterações da sessão que já foram commitadas — cada commit
deve ser autocontido e descrever apenas o que está sendo commitado agora.

Analisar o conteúdo do diff para identificar:
- Qual(is) módulo(s) foi(ram) alterado(s)
- Qual o tipo da alteração (feat, fix, refactor, docs, chore, ci, test, style, perf)
- Se há breaking changes

### 3. Gerar a mensagem de commit

Gerar a mensagem seguindo **todas** as regras abaixo:

**Formato Conventional Commits:**
```
<tipo>(<escopo>): <descrição imperativa em pt-BR>

[corpo opcional — explicação do "por quê", não do "o quê"]

[footer opcional — BREAKING CHANGE:, Refs:, etc.]
```

**Regras obrigatórias:**

| Regra | Detalhe |
|---|---|
| Idioma | **Português-BR** (descrição, corpo e footer) |
| Escopo | **Obrigatório** — um dos escopos válidos (definidos conforme o projeto) |
| Descrição | Imperativa, minúscula, sem ponto final, máximo 72 caracteres |
| Corpo | Explicar o "por quê" quando não for óbvio. Separado por linha em branco |
| Breaking change | Usar `!` após o escopo (ex: `feat(app)!:`) E adicionar `BREAKING CHANGE:` no footer |

**Tipos válidos:**

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Mudança de código que não adiciona feature nem corrige bug |
| `docs` | Alterações de documentação |
| `test` | Adição ou correção de testes |
| `chore` | Manutenção (dependências, configs, scripts) |
| `ci` | Alterações de CI/CD |
| `style` | Formatação (sem mudança de lógica) |
| `perf` | Melhoria de desempenho |

### 4. Apresentar para aprovação

**Modo direto:** pular este passo e executar o commit imediatamente com a mensagem gerada.

**Modo normal:** apresentar a mensagem gerada ao usuário no seguinte formato:

```
Mensagem de commit sugerida:

  <tipo>(<escopo>): <descrição>

  <corpo opcional>

Deseja ajustar algo antes de confirmar?
```

Aguardar a aprovação ou ajuste do usuário. **NÃO executar o commit sem aprovação explícita.**

### 5. Executar o commit

Após aprovação, executar:

```bash
git commit -m "<mensagem aprovada>"
```

Se houver corpo ou footer, usar a forma multi-linha:

```bash
git commit -m "<primeira linha>" -m "<corpo>" -m "<footer>"
```

### 6. Confirmar sucesso

// turbo
```bash
git log -1 --oneline
```

Informar o hash e a mensagem do commit criado.

### 7. Sincronizar com repositório origem

**Modo direto:** executar `git push` automaticamente.

**Modo normal:** perguntar ao usuário:

```
Deseja sincronizar com o repositório origem (git push)?
```

Se sim, executar:

```bash
git push
```

Se não, encerrar o workflow.

## Exemplos

**Feature simples:**
```
feat(app): adicionar tela de login com autenticação Google
```

**Fix com corpo explicativo:**
```
fix(api): corrigir validação de campos obrigatórios no cadastro

O endpoint não retornava erro 422 quando campos obrigatórios estavam
ausentes. Adicionada validação com schema Zod antes do handler.

Refs: 01-INTENT.md § 3
```

**Documentação (specs, rules, ADRs):**
```
docs(docs): adicionar spec 01-INTENT e scaffolding SDD
```

**Breaking change:**
```
refactor(api)!: renomear endpoint /events para /races

BREAKING CHANGE: todos os clientes que consomem /events devem
atualizar para /races.
```
