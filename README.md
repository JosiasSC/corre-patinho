# corre-patinho

> **Projeto em fase de especificação.**

## Estrutura do Repositório

```
corre-patinho/
├── AGENTS.md                          # Contexto para agentes de IA
├── .agents/
│   ├── rules/                         # Regras comportamentais do agente
│   │   ├── sdd-protocol.md            # Protocolo SDD (Spec-Anchored)
│   │   └── wiki-maintenance.md        # Manutenção da wiki
│   ├── specs/                         # Especificações autoritativas
│   │   └── README.md                  # Convenções de specs
│   ├── workflows/                     # Workflows invocáveis
│   │   ├── commit.md                  # /commit
│   │   ├── register-adr.md            # /register-adr
│   │   └── register-task.md           # /register-task
│   ├── wiki/                          # Base de conhecimento compilada
│   │   ├── index.md                   # Índice do wiki
│   │   ├── decisions-consolidated.md  # Decisões vigentes
│   │   └── decisions-log.md           # Log de decisões
│   ├── archive/                       # Arquivo morto
│   │   ├── adrs/                      # ADRs completas
│   │   └── todo-done.md              # Tarefas concluídas
│   └── todo.md                        # Backlog de tarefas
└── README.md                          # Este arquivo
```

## Metodologia

Este projeto segue o **SDD (Spec Driven Development)** com o modelo **Spec-Anchored**:

- As especificações em `.agents/specs/` são a **fonte de verdade autoritativa**
- O código é um artefato derivado das specs
- Decisões arquiteturais são registradas como ADRs em `.agents/archive/adrs/`
- O conhecimento cross-cutting é sintetizado no wiki em `.agents/wiki/`

Para detalhes completos, consultar `.agents/rules/sdd-protocol.md`.