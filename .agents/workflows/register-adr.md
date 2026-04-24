---
description: >
  Procedimento para registrar uma nova ADR (Architecture Decision Record).
  Usar quando uma decisão arquitetural relevante for tomada ou quando o agente
  identificar que uma decisão significativa foi feita sem registro formal.
---

# Registrar ADR (Architecture Decision Record)

## Quando registrar uma ADR

Registrar uma ADR **sempre que**:

- Uma decisão de arquitetura, tecnologia ou padrão de design for tomada que afete múltiplos módulos ou o sistema como um todo.
- Uma alternativa significativa for avaliada e **rejeitada** — especialmente se o agente ou outro desenvolvedor pode propô-la no futuro.
- Uma decisão existente for **substituída** por outra (a ADR anterior recebe status `superseded`).
- O agente propuser uma solução e o usuário indicar que aquele caminho já foi avaliado e descartado.

**Não registrar ADR para:**
- Decisões triviais de implementação (nome de variável, ordem de parâmetros).
- Escolhas que já estão documentadas como padrão nas specs.

## Passos

1. Identificar o próximo número sequencial:
   ```bash
   ls .agents/archive/adrs/ | sort -n | tail -1
   ```

2. Criar o arquivo `.agents/archive/adrs/ADR-NNNN-titulo-kebab-case.md` usando o template abaixo.

3. Preencher **todas** as seções, especialmente "Alternativas Rejeitadas" — esta é a seção mais valiosa para evitar que agentes re-explorem caminhos descartados.

4. Se a ADR substitui uma decisão anterior, atualizar o `status` da ADR anterior para `superseded` e adicionar o campo `supersededBy`.

5. Atualizar ref cruzadas nas specs se necessário (ex: "Ver ADR-0001").

6. Atualizar `.agents/wiki/decisions-consolidated.md` com o resumo da decisão.

## Template

```markdown
---
description: >
  ADR sobre [resumo conciso da decisão em 1 linha].
  Alternativas rejeitadas: [lista curta separada por vírgula].
  Consultar quando [contexto de quando esta ADR é relevante].
status: accepted
date: YYYY-MM-DD
---

# ADR-NNNN — [Título Descritivo da Decisão]

## Contexto

[Qual problema, requisito ou restrição motivou esta decisão.
Inclua números, métricas e restrições quando aplicável.]

## Decisão

[O que foi decidido. Seja específico e imperativo.]

## Alternativas Rejeitadas

### [Nome da Alternativa A]
- **Descrição:** [O que seria feito.]
- **Motivo da rejeição:** [Por que não funciona no contexto deste projeto.]

### [Nome da Alternativa B]
- **Descrição:** [O que seria feito.]
- **Motivo da rejeição:** [Por que não funciona no contexto deste projeto.]

## Consequências

- **Positivas:** [Benefícios obtidos com esta decisão.]
- **Trade-offs:** [Custos ou limitações aceitos.]

## Referências

- [Links para specs, issues ou documentos relacionados]
```

## Exemplo de preenchimento

> **Contexto:** "O sistema precisa de uma estratégia de deploy para múltiplos ambientes."
> **Decisão:** "Usar Docker com multi-stage build e deploy via GitHub Actions."
> **Alternativa rejeitada:** "Deploy manual via SSH — rejeitado por falta de reprodutibilidade."
> **Alternativa rejeitada:** "Serverless — rejeitado por requisitos de estado persistente."
