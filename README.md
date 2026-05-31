# Calculadora Penal

Projeto de Extensão Universitária — Instituto Mauá de Tecnologia × Cespedes Lourenço Advogados

---

## Integrantes do Grupo

João Pedro Schimidt Mantovani|25.00922-6|
Pedro Rodrigues Furlaneti|25.00897-0|

---

## Descrição Geral

Aplicação web que calcula automaticamente as datas de progressão de regime (Semiaberto e Aberto) e de Livramento Condicional para condenados no sistema penal brasileiro, com base na Lei 13.964/2019 (Pacote Anticrime) e no Art. 83 do Código Penal.

O objetivo é democratizar o acesso à informação jurídica, permitindo que familiares e cidadãos leigos compreendam as datas relevantes da execução penal de forma clara, sem necessidade de conhecimento técnico especializado.

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│                  CLIENTE                     │
│   Browser → index.html + style.css + main.js│
│   (Servidos como estáticos pelo Ktor)        │
└──────────────────┬──────────────────────────┘
                   │ HTTP POST /api/calcular (JSON)
┌──────────────────▼──────────────────────────┐
│              SERVIDOR KTOR (Netty)           │
│  ┌─────────────────────────────────────┐    │
│  │ Routing.kt — recebe e roteia        │    │
│  │ ContentNegotiation — JSON ↔ objetos │    │
│  └──────────────┬──────────────────────┘    │
│  ┌──────────────▼──────────────────────┐    │
│  │ PenalCalculator.kt — motor de       │    │
│  │ cálculo com java.time               │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Stack:**
- **Backend:** Kotlin 2.0 + Ktor 2.3 (Netty engine)
- **Frontend:** HTML5 + CSS3 + JavaScript (vanilla, sem frameworks)
- **Serialização:** kotlinx.serialization (JSON)
- **Data/Tempo:** `java.time` (precisão de calendário com anos bissextos)
- **Build:** Gradle 8.10 com Kotlin DSL

---

## Fluxo Operacional

```
Usuário preenche o formulário
        │
        ▼
Validação no cliente (JS)
        │
        ▼
POST /api/calcular  →  Ktor recebe JSON
        │
        ▼
PenalCalculator.calculate()
  1. Parse da dataInicio (ISO 8601)
  2. Calcula fim da pena total via java.time
  3. Calcula detração em dias reais de calendário
  4. Pena Líquida = dias_pena_total - dias_detracao
  5. Seleciona fração de progressão (Lei 13.964/19)
  6. Seleciona fração de L.C. (Art. 83 CP)
  7. dataSemiaberto = dataBase + (líquida × fração)
  8. dataAberto     = dataBase + (líquida × fração × 2)
  9. dataLC         = dataBase + (líquida × fração_LC)
        │
        ▼
Resposta JSON → Frontend exibe resultados
        │
        ▼
CTA WhatsApp → Encaminha para atendimento jurídico
```

---

## Funcionalidades Principais

### Cálculo de Progressão de Regime (Art. 112 LEP — Lei 13.964/19)

| Tipo de Crime                          | Primário | Reincidente |
|----------------------------------------|----------|-------------|
| Comum                                  | 16%      | 20%         |
| Comum com Violência ou Grave Ameaça    | 25%      | 30%         |
| Hediondo / Equiparado                  | 40%      | 60%         |
| Hediondo com Resultado Morte           | 50%      | 70%         |

### Cálculo de Livramento Condicional (Art. 83 CP)

| Tipo de Crime                          | Primário        | Reincidente     |
|----------------------------------------|-----------------|-----------------|
| Comum / Comum c/ Violência             | 1/3 (33,33%)    | 1/2 (50,00%)    |
| Hediondo / Equiparado (sem morte)      | 2/3 (66,67%)    | 2/3 (66,67%)    |
| Hediondo com Resultado Morte           | **VEDADO**      | **VEDADO**      |

### Interface
- Formulário responsivo com validação em tempo real
- Máscara automática para número do processo (NNNNNNN-DD.AAAA.J.TT.OOOO)
- Máscara automática para número de WhatsApp brasileiro
- Preview das frações aplicáveis ao selecionar tipo/status
- Botão de contato direto via WhatsApp do escritório

---

## Tecnologias Utilizadas

| Componente            | Tecnologia                       | Versão   |
|-----------------------|----------------------------------|----------|
| Linguagem Backend     | Kotlin                           | 2.0.21   |
| Framework HTTP        | Ktor (engine Netty)              | 2.3.12   |
| Serialização          | kotlinx.serialization (JSON)     | 1.7.x    |
| Cálculo de Datas      | java.time (ChronoUnit, LocalDate)| JDK 17+  |
| Logging               | Logback                          | 1.4.14   |
| Build                 | Gradle (Kotlin DSL)              | 8.10     |
| Frontend              | HTML5 + CSS3 + JavaScript Vanilla| —        |

---

## Infraestrutura de Execução do Projeto

A aplicação é **autocontida**: o próprio Ktor sobe um servidor HTTP embutido (Netty), sem necessidade de instalar Apache, Nginx ou Tomcat separadamente.

| Componente         | Detalhe                                                   |
|--------------------|-----------------------------------------------------------|
| Servidor HTTP      | Netty embutido via Ktor (sem servidor externo)            |
| Porta padrão       | `8080` (configurável em `Application.kt`)                 |
| Plataforma         | JVM (Java Virtual Machine) — compatível com Windows, Linux e macOS |
| Mínimo de RAM      | ~256 MB para execução local                               |
| Frontend           | Servido estaticamente pelo próprio Ktor (sem Node.js)     |
| Imagens/Assets     | Lidos do sistema de arquivos local (`imagens-logos/`)     |

> O projeto **não depende de banco de dados** nesta versão. Todos os cálculos são realizados em memória a cada requisição.

---

## Configuração do Ambiente para Instalação

### Pré-requisitos

- **Java JDK 17** ou superior instalado
- **Gradle 8.x** instalado globalmente (ou use o wrapper após `gradle wrapper`)

### Estrutura de diretórios

```
Kotlin/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/wrapper/
├── imagens-logos/          ← logos servidos em /imagens/*
└── src/
    └── main/
        ├── kotlin/com/calculadorapenal/
        │   ├── Application.kt
        │   ├── calculator/PenalCalculator.kt
        │   ├── models/Models.kt
        │   └── plugins/Routing.kt
        └── resources/
            ├── logback.xml
            └── static/
                ├── index.html
                ├── css/style.css
                └── js/main.js
```

### Passo a Passo

```bash
# 1. Inicializar o Gradle wrapper (apenas na primeira vez, se não existir)
gradle wrapper

# 2. Executar em modo de desenvolvimento
./gradlew run          # Linux/Mac
gradlew.bat run        # Windows

# 3. Acessar no navegador
# http://localhost:8080
```

### Build para produção (fat JAR)

```bash
./gradlew buildFatJar
java -jar build/libs/calculadora-penal-all.jar
```

> **Importante:** execute o servidor sempre a partir do diretório raiz do projeto (`Kotlin/`) para que a pasta `imagens-logos/` seja encontrada corretamente.

---

## Documentação dos Endpoints da API

### `POST /api/calcular`

Calcula as datas de progressão e livramento condicional.

**Content-Type:** `application/json`

#### Request Body

```json
{
  "nomeCompleto":   "João da Silva",
  "whatsapp":       "(11) 9 8949-8044",
  "email":          "joao@email.com",
  "numeroProcesso": "0000001-12.2023.8.26.0100",
  "penaAnos":       8,
  "penaMeses":      0,
  "penaDias":       0,
  "dataInicio":     "2023-03-15",
  "detracaoAnos":   0,
  "detracaoMeses":  6,
  "detracaoDias":   0,
  "tipoCrime":      "COMUM",
  "statusApenado":  "PRIMARIO"
}
```

| Campo           | Tipo    | Obrigatório | Descrição                                                  |
|-----------------|---------|-------------|-------------------------------------------------------------|
| nomeCompleto    | String  | Sim         | Nome completo do apenado                                   |
| whatsapp        | String  | Sim         | Número de WhatsApp para contato                            |
| email           | String  | Não         | E-mail para contato                                        |
| numeroProcesso  | String  | Não         | Número no formato NNNNNNN-DD.AAAA.J.TT.OOOO               |
| penaAnos        | Int     | —           | Anos da pena total (padrão: 0)                             |
| penaMeses       | Int     | —           | Meses da pena total (padrão: 0)                            |
| penaDias        | Int     | —           | Dias da pena total (padrão: 0)                             |
| dataInicio      | String  | Sim         | Data de início do cumprimento (formato ISO: YYYY-MM-DD)    |
| detracaoAnos    | Int     | —           | Anos de detração (padrão: 0)                               |
| detracaoMeses   | Int     | —           | Meses de detração (padrão: 0)                              |
| detracaoDias    | Int     | —           | Dias de detração (padrão: 0)                               |
| tipoCrime       | Enum    | Sim         | `COMUM`, `COMUM_VIOLENCIA`, `HEDIONDO`, `HEDIONDO_MORTE`   |
| statusApenado   | Enum    | Sim         | `PRIMARIO` ou `REINCIDENTE`                                |

#### Response `200 OK`

```json
{
  "nomeCompleto": "João da Silva",
  "penaLiquida": {
    "totalDias": 2739,
    "descricao": "7 anos, 6 meses"
  },
  "dataBase": "15/03/2023",
  "dataSemiaberto": "13/08/2023",
  "dataAberto":     "11/01/2024",
  "dataLivramentoCondicional": "14/07/2025",
  "livramentoVedado":   false,
  "fracaoProgressao":   "16%",
  "fracaoLC":           "1/3 (33,33%)",
  "alertaAbertoNaFimDaPena": false
}
```

#### Response `400 Bad Request`

```json
{ "erro": "A pena líquida (após detração) deve ser maior que zero." }
```

#### Rotas estáticas

| Rota          | Descrição                                         |
|---------------|---------------------------------------------------|
| `GET /`       | Interface web (index.html)                        |
| `GET /css/*`  | Folhas de estilo                                  |
| `GET /js/*`   | Scripts JavaScript                                |
| `GET /imagens/*` | Logos e imagens da pasta `imagens-logos/`      |

---

## Futuras Melhorias (Roadmap)

Funcionalidades planejadas para versões futuras do projeto:

| Prioridade | Melhoria                                                                 |
|------------|--------------------------------------------------------------------------|
| Alta       | Geração de relatório em PDF com os resultados do cálculo                 |
| Alta       | Cálculo de remição por trabalho (Art. 126 LEP) e por estudo              |
| Média      | Histórico de cálculos salvos (integração com banco de dados)             |
| Média      | Envio automático do resultado por e-mail ou WhatsApp                     |
| Média      | Painel administrativo para o escritório visualizar consultas realizadas  |
| Baixa      | Autenticação de usuários (login para salvar casos)                       |
| Baixa      | Suporte a múltiplos idiomas (internacionalização)                        |
| Baixa      | Modo escuro na interface                                                 |

---

## Referências

### Base Legal
- **Lei nº 13.964/2019** — Pacote Anticrime. Altera o Art. 112 da Lei de Execução Penal, estabelecendo novas frações para progressão de regime. Disponível em: [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm)
- **Decreto-Lei nº 2.848/1940** — Código Penal Brasileiro, Art. 83 (Livramento Condicional). Disponível em: [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm)
- **Lei nº 7.210/1984** — Lei de Execução Penal (LEP). Disponível em: [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/leis/l7210.htm)

### Tecnologias
- Ktor Documentation — [ktor.io/docs](https://ktor.io/docs/)
- Kotlin Language Reference — [kotlinlang.org](https://kotlinlang.org/docs/)
- kotlinx.serialization — [github.com/Kotlin/kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization)
- Java Time API (java.time) — [docs.oracle.com](https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/time/package-summary.html)

### Instituições Parceiras
- Instituto Mauá de Tecnologia — [maua.br](https://www.maua.br)
- Cespedes Lourenço Advogados — Escritório parceiro do projeto de extensão
