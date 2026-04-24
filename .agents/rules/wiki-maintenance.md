---
description: >
  Regra de manutenção da base de conhecimento compilada (wiki) do corre-patinho.
  Aplicar ao final de sessões que envolvam decisões arquiteturais, refatorações,
  resolução de bugs não-triviais, ou mudanças em specs/APIs/contratos públicos.
---

# Manutenção da Base de Conhecimento (Wiki)

## Quando atualizar
Ao final de qualquer sessão que envolva:
- Decisões arquiteturais ou trade-offs
- Correções de bugs não-triviais
- Novos padrões, convenções ou refatorações
- Mudanças em specs, APIs ou contratos públicos
- Novos módulos ou componentes
- Resolução de problemas que exigiram investigação

## Como atualizar
1. Leia `.agents/wiki/index.md` para identificar as páginas existentes
2. Atualize as páginas afetadas OU crie novas se o tópico não existir
3. Atualize o `index.md` se novas páginas foram criadas
4. Faça commit das mudanças no wiki junto com o código

## Formato das páginas wiki
- Markdown com cross-references usando links relativos
- Cabeçalho: `Última atualização: YYYY-MM-DD`
- Seção `## Fontes` no final, apontando para specs, ADRs, arquivos e sessões
- Sintetize, não copie — specs, ADRs e API.md continuam sendo fonte de verdade

## O que NÃO deve ir no wiki
- Código-fonte (já está no repositório)
- Conteúdo que duplica specs ou ADRs verbatim
- Informações temporárias ou específicas de uma sessão
- Decisões arquiteturais formais (devem ser ADRs via `/register-adr`)
