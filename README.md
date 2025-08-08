# Sistema de Gestão de Voluntários - Cuscuz Solidário

## 📋 Visão Geral

Sistema moderno e profissional desenvolvido em React para gerenciar voluntários do projeto Cuscuz Solidário do NEEL (Núcleo Espírita Esperança de Luz). O sistema oferece funcionalidades avançadas de gerenciamento de datas, voluntários e alocações, com design responsivo e preparação para integração com N8N e Google Sheets.

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação
- **Dois tipos de usuário**: Voluntário e Coordenador
- **Chaves de acesso**:
  - Voluntário: `voluntario2025`
  - Coordenador: `coordenador2025`
- **Interface de login** com validação e feedback visual

### 📅 Gerenciamento de Datas
- **4 datas fixas**: Sistema sempre mantém 4 sábados consecutivos (a cada 2 semanas)
- **Rotação automática**: Quando um evento é marcado como concluído, uma nova data é automaticamente adicionada
- **Edição de datas**: Coordenadores podem editar datas existentes
- **Marcar como concluído**: Funcionalidade de check para eventos realizados

### 👥 Gerenciamento de Voluntários
- **Cadastro de disponibilidade**: Voluntários podem marcar suas datas disponíveis
- **Adição de voluntários**: Coordenadores podem adicionar novos voluntários
- **Remoção de disponibilidade**: Opção para remover disponibilidade específica

### 🎯 Sistema de Alocação
- **Funções fixas sempre visíveis**:
  - Equipe do Cuscuz
  - Expositor
  - Recepção
  - Salão
  - Evangelização Infantil
- **Alocação dinâmica**: Coordenadores podem alocar voluntários às funções
- **Desalocação**: Possibilidade de remover alocações existentes
- **Visual limpo**: Voluntários alocados aparecem em negrito (sem sombreado azul)

### 🎨 Design e UX
- **Tema verde profissional**: Paleta de cores baseada no verde do Cuscuz Solidário
- **Interface responsiva**: Funciona perfeitamente em desktop e mobile
- **Componentes modernos**: Utiliza shadcn/ui para interface consistente
- **Notificações toast**: Feedback visual para todas as ações
- **Animações suaves**: Transições e hover effects

### 🔗 Integração N8N (Preparada)
- **API completa**: Módulos prontos para integração com N8N
- **Sincronização com Google Sheets**: Estrutura preparada para sync bidirecional
- **Webhooks configuráveis**: Endpoints para todas as operações
- **Hooks React**: Sistema de hooks para gerenciar estado da API

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework de CSS utilitário
- **shadcn/ui**: Biblioteca de componentes
- **Lucide React**: Ícones modernos
- **Framer Motion**: Animações (preparado)

### Ferramentas de Desenvolvimento
- **ESLint**: Linting de código
- **pnpm**: Gerenciador de pacotes
- **Git**: Controle de versão

## 📁 Estrutura do Projeto

```
cuscuz-solidario-react/
├── public/                 # Arquivos públicos
├── src/
│   ├── assets/            # Imagens e recursos estáticos
│   │   └── logo.svg       # Logo do Cuscuz Solidário
│   ├── components/
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   ├── hooks/             # Hooks customizados
│   │   └── useApi.js      # Hooks para integração API/N8N
│   ├── lib/               # Utilitários e bibliotecas
│   │   └── api.js         # Módulo de API para N8N
│   ├── App.css            # Estilos principais
│   ├── App.jsx            # Componente principal
│   ├── index.css          # Estilos globais
│   └── main.jsx           # Ponto de entrada
├── components.json        # Configuração shadcn/ui
├── package.json           # Dependências e scripts
├── tailwind.config.js     # Configuração Tailwind
├── vite.config.js         # Configuração Vite
└── README.md              # Esta documentação
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- pnpm (ou npm/yarn)

### Instalação e Execução
```bash
# Navegar para o diretório
cd cuscuz-solidario-react

# Instalar dependências (já instaladas)
pnpm install

# Executar em modo desenvolvimento
pnpm run dev --host

# Acessar no navegador
http://localhost:5174
```

### Build para Produção
```bash
# Gerar build otimizado
pnpm run build

# Preview do build
pnpm run preview
```

## 🔑 Credenciais de Acesso

### Voluntário
- **Chave**: `voluntario2025`
- **Funcionalidades**: Marcar disponibilidade, visualizar alocações

### Coordenador
- **Chave**: `coordenador2025`
- **Funcionalidades**: Todas as do voluntário + gerenciar datas, adicionar voluntários, fazer alocações

## 📊 Integração N8N e Google Sheets

### Configuração N8N
O sistema está preparado para integração com N8N através de webhooks. Configure as seguintes variáveis de ambiente:

```env
REACT_APP_N8N_BASE_URL=https://your-n8n-instance.com/webhook
```

### Endpoints Disponíveis
- `GET /get-dates` - Buscar datas
- `POST /update-dates` - Atualizar datas
- `GET /get-volunteers` - Buscar voluntários
- `POST /update-volunteers` - Atualizar voluntários
- `GET /get-availability` - Buscar disponibilidade
- `POST /update-availability` - Atualizar disponibilidade
- `GET /get-allocations` - Buscar alocações
- `POST /update-allocations` - Atualizar alocações
- `POST /mark-event-complete` - Marcar evento como concluído

### Estrutura Google Sheets
O sistema espera as seguintes planilhas:

#### Planilha "Datas"
| id | date | status | created_at |
|----|------|--------|------------|
| 2025-08-09 | 2025-08-09 | active | 2025-08-08T15:00:00Z |

#### Planilha "Voluntários"
| id | name | created_at |
|----|------|------------|
| 1 | Maria Silva | 2025-08-08T15:00:00Z |

#### Planilha "Disponibilidade"
| volunteer_id | volunteer_name | date | created_at |
|--------------|----------------|------|------------|
| 1 | Maria Silva | 2025-08-09 | 2025-08-08T15:00:00Z |

#### Planilha "Alocações"
| id | date | function | person | created_at |
|----|------|----------|--------|------------|
| 1 | 2025-08-09 | Equipe do Cuscuz | Maria Silva | 2025-08-08T15:00:00Z |

## 🎯 Funcionalidades Implementadas

### ✅ Requisitos Atendidos
1. **4 datas fixas**: ✅ Sistema sempre mantém 4 sábados
2. **Remoção de disponibilidade**: ✅ Botão X para remover
3. **Sistema de check**: ✅ Marcar eventos como concluídos
4. **Funções fixas sempre visíveis**: ✅ 5 funções sempre aparecem
5. **Design profissional**: ✅ Cores ajustadas, sem sombreados excessivos
6. **Projeto React**: ✅ Aplicação moderna e responsiva
7. **Preparação N8N**: ✅ API e hooks prontos para integração

### 🔄 Fluxo de Uso

#### Para Voluntários
1. Fazer login com `voluntario2025`
2. Digitar nome e selecionar datas disponíveis
3. Confirmar disponibilidade
4. Visualizar alocações nos cards das datas

#### Para Coordenadores
1. Fazer login com `coordenador2025`
2. Adicionar novos voluntários
3. Editar datas existentes (ícone de lápis)
4. Marcar eventos como concluídos (ícone de check)
5. Alocar voluntários clicando nos nomes disponíveis
6. Desalocar voluntários clicando nos nomes alocados
7. Remover disponibilidades específicas (botão X)

## 🎨 Personalização de Cores

O sistema utiliza uma paleta de cores profissional baseada no verde:

```css
/* Cores principais */
--primary: oklch(0.45 0.15 150);     /* Verde principal */
--secondary: oklch(0.55 0.12 210);   /* Azul aço */
--accent: oklch(0.52 0.15 140);      /* Verde claro */
```

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- **Desktop**: Layout em grid com 2 colunas para os cards
- **Tablet**: Layout adaptativo
- **Mobile**: Layout em coluna única com componentes otimizados

## 🔧 Manutenção e Suporte

### Logs e Debug
- Console do navegador mostra logs detalhados
- Notificações toast para feedback do usuário
- Estados de loading para operações assíncronas

### Backup de Dados
- Dados locais são mantidos no estado React
- Integração N8N permite backup automático no Google Sheets
- Estrutura preparada para sincronização bidirecional

## 📈 Próximos Passos

1. **Configurar N8N**: Implementar workflows no N8N
2. **Conectar Google Sheets**: Configurar planilhas e webhooks
3. **Deploy**: Fazer deploy da aplicação
4. **Treinamento**: Treinar usuários no sistema
5. **Monitoramento**: Implementar logs e métricas

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça fork do repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um pull request

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para o Cuscuz Solidário - NEEL**

