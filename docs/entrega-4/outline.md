# Entrega 4 – Esqueleto do relatório

Estado: **esqueleto**. Preencher só com o que existir de fato no repositório e em `docs/evidence/` (DLV-26, DLV-29). Os campos entre `[ ]` são marcadores de preenchimento.

Formato final do arquivo enviado ao Moodle: a definir (OQ-18).

---

## 1. Identificação do projeto

Atende: DLV-01, DLV-02, DLV-03, DLV-04

- **Nome do projeto:** PETSEARCH: um portal de animais perdidos
- **Integrantes (nome completo e prontuário):** [9 nomes com a grafia confirmada, OQ-02]
  - Adriano Camocardi Junior – SL3051901
  - Arthur Tonon Silva – SL3050793
  - Cauan Teixeira Jardim – SL3051391
  - Erick Henrique Toaliari Fortunato – SL305070X
  - Mario Henrique Martins Alves Pedrao – SL3051617
  - Mateus Rodrigues Zerbini – SL3051731
  - Pedro Eduardo Malfatti Valim – SL3051382 (líder)
  - Ryan Alves Correia – SL3051765
  - Thales Andre Ferreira da Silva – SL305263X
- **Semestre:** 5º semestre, Tecnologia em Análise e Desenvolvimento de Sistemas, IFSP Campus Salto, 2º semestre de 2026. Coordenador: Prof. Leonel Cardoso Leal.
- **Público-alvo:** tutores e moradores de Indaiatuba, protetores independentes e voluntários. Entidade de referência: UPAR (União Protetora dos Animais de Rua), **sem contato ou parceria confirmados**.

Evidência necessária: nenhuma além da conferência dos nomes.

## 2. Retomada da proposta

Atende: DLV-05, DLV-06, DLV-07

- **Problema:** cadastros de microchip em serviços separados dificultam identificar o tutor de um animal encontrado (relato da Prefeitura de Indaiatuba, 2024; slides p3). Dados de acolhimento da UPAR em 2023 (160 cães, 23 gatos, 17 em lares temporários) são históricos e **não medem animais perdidos** (slides p4).
- **Objetivo:** organizar avisos de animais perdidos e encontrados em Indaiatuba.
- **Funcionalidades previstas:** fotos e características; filtros por bairro e data; avistamentos e atualização do caso; contato protegido e bairro aproximado; moderação.
- **Retorno do IFCIÊNCIA:** sugestão do Prof. Diego de incluir uma seção de adoção responsável. Classificação: [planejada para 30/11 ou incluída; ver OQ-01].
- Referências: Prefeitura de Indaiatuba (Sistema Meu PET); Jornal Mais Expressão (UPAR).

Evidência necessária: slides e relatório pós-IFCIÊNCIA (`docs/sources/`).

## 3. Nova versão do protótipo

Atende: DLV-08, DLV-09, DLV-10, DLV-28

- **Versão anterior:** apenas conceito: fluxo de 4 passos e aviso fictício da Luna nos slides, sem protótipo (slides p5, p7, p9).
- **Versão atual:** [URL publicada, commit/tag, data]
- **Estágio atual e limitações:** [o que funciona, o que não funciona, limitações conhecidas, por exemplo a espera de cerca de 50 s ao abrir o servidor gratuito]
- **Funcionalidades implementadas ou aprimoradas:** [gerar a partir da tabela abaixo]
- **Registros:** [capturas de tela em 360px por tela, diagrama do fluxo, modelo de dados, vídeo curto da demonstração]

Evidência necessária: `docs/evidence/*_DLV-08_*`, capturas por rota, diagrama.

### Implementado vs planejado

Gerar a partir de `docs/requirements.md` no dia do envio. Nunca marcar "Implementado" sem o status `implemented` ou `verified` na matriz.

| Funcionalidade | ID | Situação (Implementado / Parcial / Planejado 30/11 / Futuro) | Evidência |
|---|---|---|---|
| Publicar aviso de animal perdido | FR-01 | [ ] | [ ] |
| Fotos e características | FR-02, FR-03 | [ ] | [ ] |
| Bairro e data | FR-04, FR-05 | [ ] | [ ] |
| Situação do caso | FR-06 | [ ] | [ ] |
| Lista pública e filtros (bairro, data, características) | FR-07 a FR-10 | [ ] | [ ] |
| Página do aviso para comparação | FR-11 | [ ] | [ ] |
| Envio de avistamento | FR-12 | [ ] | [ ] |
| Tutora confere e atualiza o caso | FR-13, FR-14 | [ ] | [ ] |
| Aviso de animal encontrado | FR-15 | [ ] | [ ] |
| Contas e controle de acesso | FR-16, PRV-04 | [ ] | [ ] |
| Moderação | FR-17 | [ ] | [ ] |
| Contato protegido e bairro aproximado | PRV-01, PRV-02 | [ ] | [ ] |
| Consentimento e privacidade (LGPD) | PRV-03, PRV-07 | [ ] | [ ] |
| Dados fictícios identificados | FR-21 | [ ] | [ ] |
| Seção de adoção responsável | FR-20 | [ ] | [ ] |
| Notificações | FR-23 | Futuro | - |
| Mapas | FR-24 | Futuro | - |

## 4. Testes realizados

Atende: DLV-11, DLV-12, DLV-13

Preencher **somente** com testes que aconteceram. Se algum não ocorreu, escrever "não realizado".

- **Testes automatizados:** [quantidade de testes unitários, de API e E2E; resultado da última execução; link para o log]
- **Acessibilidade:** [resultado do axe por rota; teste manual com teclado e leitor de tela]
- **Testes com usuários:** [número de participantes e perfil (colega/morador/protetor), datas, dispositivo]
  - Procedimento: roteiro com 3 tarefas baseadas no aviso fictício da Luna (publicar; buscar por bairro; registrar avistamento e atualizar o caso), observando conclusão, tempo, dúvidas, facilidade de comparar dados e clareza das ações.
  - Resultados por tarefa: [tabela consolidada a partir dos registros]
- **Falhas, dificuldades e limitações:** [lista F-nn de `findings.md`]

Evidência necessária: logs de teste, relatório do axe, registros das sessões, `findings.md`.

## 5. Ajustes e melhorias

Atende: DLV-14, DLV-15, DLV-16

- **Alterações após os testes:** [cada item: problema (F-nn), mudança feita, commit, reteste]
- **Justificativa das decisões principais:** [stack (ADR 0001), contato protegido por mensagens no app, bairro por lista, decisões de `open-questions.md`]
- **Comparação anterior x atual:** [conceito dos slides x telas atuais; antes/depois de cada ajuste]

Evidência necessária: `adjustments.md`, capturas de antes e depois, ADRs.

## 6. Evidências do desenvolvimento

Atende: DLV-17, DLV-18, DLV-19, DLV-20

- Capturas de tela: [lista de arquivos]
- Registros de testes: [lista de arquivos]
- Diagramas, fluxos e documentos: [fluxo, modelo de dados, matriz de requisitos]
- Outros: [histórico de commits, execuções de CI, URL publicada]

## 7. Próximos passos

Atende: DLV-21, DLV-22, DLV-23

- **Atividades restantes:** [linhas da matriz ainda não `verified`]
- **Funcionalidades pendentes:** [planejadas para 30/11, por exemplo adoção (se aprovada), sinalização de conteúdo, PWA]
- **Plano até 30/11:** [cronograma com responsáveis: 2ª rodada de testes com moradores e protetores, plano de manutenção, relatório final e apresentação com o protótipo]

---

## Checklist antes do envio

Atende: DLV-24, DLV-25, DLV-26, DLV-27, DLV-29, DLV-30, DLV-31, DLV-32

- [ ] Arquivo completo: seções 1 a 7 preenchidas, sem marcadores `[ ]` sobrando
- [ ] Os 9 integrantes identificados com nome completo na grafia confirmada (OQ-02)
- [ ] Participação do grupo registrada (responsáveis pelas tarefas)
- [ ] Texto claro e objetivo, focado na evolução da solução
- [ ] Toda captura, teste e ajuste citado tem arquivo correspondente em `docs/evidence/`
- [ ] Evidências correspondem à versão atual (commit/data indicados)
- [ ] Tabela "Implementado vs planejado" conferida com `docs/requirements.md`
- [ ] Nenhum teste, ajuste ou avaliação apresentado sem ter ocorrido
- [ ] Dados de exemplo (Luna e outros) indicados como fictícios
- [ ] Nenhum dado pessoal real em capturas de tela
- [ ] Nenhuma menção que sugira parceria com a UPAR
- [ ] Imagens próprias, licenciadas ou com crédito
- [ ] Um integrante envia pela atividade do Moodle até 15/11/2026 e guarda a confirmação
