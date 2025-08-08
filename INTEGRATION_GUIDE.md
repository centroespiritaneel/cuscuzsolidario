# Guia de Integração N8N - Cuscuz Solidário

## 📋 Visão Geral

Este guia detalha como configurar a integração entre o Sistema de Gestão de Voluntários do Cuscuz Solidário e o N8N para sincronização automática com Google Sheets.

## 🔧 Configuração N8N

### 1. Pré-requisitos
- Instância N8N configurada e funcionando
- Conta Google com acesso ao Google Sheets
- Credenciais Google configuradas no N8N

### 2. Estrutura das Planilhas Google Sheets

#### Planilha Principal: "Cuscuz Solidário - Gestão de Voluntários"

##### Aba "Datas"
```
| A: id | B: date | C: status | D: created_at |
|-------|---------|-----------|---------------|
| 2025-08-09 | 2025-08-09 | active | 2025-08-08T15:00:00Z |
| 2025-08-23 | 2025-08-23 | active | 2025-08-08T15:00:00Z |
| 2025-09-06 | 2025-09-06 | active | 2025-08-08T15:00:00Z |
| 2025-09-20 | 2025-09-20 | active | 2025-08-08T15:00:00Z |
```

##### Aba "Voluntários"
```
| A: id | B: name | C: created_at |
|-------|---------|---------------|
| 1 | Maria Silva | 2025-08-08T15:00:00Z |
| 2 | João Santos | 2025-08-08T15:00:00Z |
| 3 | Ana Costa | 2025-08-08T15:00:00Z |
```

##### Aba "Disponibilidade"
```
| A: volunteer_id | B: volunteer_name | C: date | D: created_at |
|-----------------|-------------------|---------|---------------|
| 1 | Maria Silva | 2025-08-09 | 2025-08-08T15:00:00Z |
| 1 | Maria Silva | 2025-08-23 | 2025-08-08T15:00:00Z |
| 2 | João Santos | 2025-08-09 | 2025-08-08T15:00:00Z |
```

##### Aba "Alocações"
```
| A: id | B: date | C: function | D: person | E: created_at |
|-------|---------|-------------|-----------|---------------|
| 1 | 2025-08-09 | Equipe do Cuscuz | Maria Silva | 2025-08-08T15:00:00Z |
| 2 | 2025-08-09 | Expositor | João Santos | 2025-08-08T15:00:00Z |
```

## 🔗 Workflows N8N

### 1. Workflow: "Cuscuz - Get Dates"
**Webhook URL**: `/webhook/get-dates`
**Método**: GET

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "get-dates",
        "httpMethod": "GET"
      }
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Datas!A:D"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const data = items[0].json.values.slice(1).map(row => ({\n  id: row[0],\n  date: row[1],\n  status: row[2] || 'active',\n  created_at: row[3]\n}));\n\nreturn [{ json: { success: true, data } }];"
      }
    }
  ]
}
```

### 2. Workflow: "Cuscuz - Update Dates"
**Webhook URL**: `/webhook/update-dates`
**Método**: POST

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "update-dates",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Clear Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "clear",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Datas!A2:D"
      }
    },
    {
      "name": "Format Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const dates = items[0].json.dates;\nconst values = dates.map(date => [\n  date.id,\n  date.date,\n  date.status,\n  new Date().toISOString()\n]);\n\nreturn [{ json: { values } }];"
      }
    },
    {
      "name": "Update Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Datas!A:D",
        "values": "={{ $json.values }}"
      }
    }
  ]
}
```

### 3. Workflow: "Cuscuz - Get Volunteers"
**Webhook URL**: `/webhook/get-volunteers`
**Método**: GET

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "get-volunteers",
        "httpMethod": "GET"
      }
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Voluntários!A:C"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const data = items[0].json.values.slice(1).map(row => ({\n  id: row[0],\n  name: row[1],\n  created_at: row[2]\n}));\n\nreturn [{ json: { success: true, data } }];"
      }
    }
  ]
}
```

### 4. Workflow: "Cuscuz - Update Volunteers"
**Webhook URL**: `/webhook/update-volunteers`
**Método**: POST

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "update-volunteers",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Check Action",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.action }}",
              "value2": "add"
            }
          ]
        }
      }
    },
    {
      "name": "Add Volunteer",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Voluntários!A:C",
        "values": [
          [
            "={{ $json.volunteer.id }}",
            "={{ $json.volunteer.name }}",
            "={{ new Date().toISOString() }}"
          ]
        ]
      }
    }
  ]
}
```

### 5. Workflow: "Cuscuz - Get Availability"
**Webhook URL**: `/webhook/get-availability`
**Método**: GET

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "get-availability",
        "httpMethod": "GET"
      }
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Disponibilidade!A:D"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const rows = items[0].json.values.slice(1);\nconst availabilityMap = {};\n\nrows.forEach(row => {\n  const volunteerName = row[1];\n  if (!availabilityMap[volunteerName]) {\n    availabilityMap[volunteerName] = {\n      id: row[0],\n      name: volunteerName,\n      dates: []\n    };\n  }\n  availabilityMap[volunteerName].dates.push(row[2]);\n});\n\nconst data = Object.values(availabilityMap);\nreturn [{ json: { success: true, data } }];"
      }
    }
  ]
}
```

### 6. Workflow: "Cuscuz - Update Availability"
**Webhook URL**: `/webhook/update-availability`
**Método**: POST

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "update-availability",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Check Action",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "values": [
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{ $json.action }}",
                  "value2": "update_volunteer"
                }
              ]
            }
          },
          {
            "conditions": {
              "string": [
                {
                  "value1": "={{ $json.action }}",
                  "value2": "remove_date"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "Update Volunteer Availability",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Remove existing entries for this volunteer\n// Then add new entries for each date\nconst volunteerName = items[0].json.volunteerName;\nconst dates = items[0].json.dates;\nconst volunteerId = items[0].json.volunteerId || Date.now();\n\nconst values = dates.map(date => [\n  volunteerId,\n  volunteerName,\n  date,\n  new Date().toISOString()\n]);\n\nreturn [{ json: { volunteerName, values } }];"
      }
    }
  ]
}
```

### 7. Workflow: "Cuscuz - Get Allocations"
**Webhook URL**: `/webhook/get-allocations`
**Método**: GET

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "get-allocations",
        "httpMethod": "GET"
      }
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Alocações!A:E"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const data = items[0].json.values.slice(1).map(row => ({\n  id: row[0],\n  date: row[1],\n  function: row[2],\n  person: row[3],\n  created_at: row[4]\n}));\n\nreturn [{ json: { success: true, data } }];"
      }
    }
  ]
}
```

### 8. Workflow: "Cuscuz - Update Allocations"
**Webhook URL**: `/webhook/update-allocations`
**Método**: POST

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "update-allocations",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Check Action",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.action }}",
              "value2": "allocate"
            }
          ]
        }
      }
    },
    {
      "name": "Add Allocation",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Alocações!A:E",
        "values": [
          [
            "={{ Date.now() }}",
            "={{ $json.allocation.date }}",
            "={{ $json.allocation.function }}",
            "={{ $json.allocation.person }}",
            "={{ new Date().toISOString() }}"
          ]
        ]
      }
    },
    {
      "name": "Remove Allocation",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Logic to find and remove specific allocation\n// This would require reading the sheet, finding the row, and deleting it\nreturn items;"
      }
    }
  ]
}
```

### 9. Workflow: "Cuscuz - Mark Event Complete"
**Webhook URL**: `/webhook/mark-event-complete`
**Método**: POST

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "mark-event-complete",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Archive Completed Event",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Eventos Concluídos!A:D",
        "values": [
          [
            "={{ $json.dateId }}",
            "={{ $json.completedDate }}",
            "completed",
            "={{ $json.timestamp }}"
          ]
        ]
      }
    },
    {
      "name": "Remove from Active Dates",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Logic to remove the completed date from active dates\n// And add a new date 2 weeks after the last remaining date\nreturn items;"
      }
    }
  ]
}
```

## 🔐 Configuração de Segurança

### 1. Autenticação
Configure autenticação básica ou API keys nos webhooks N8N:

```javascript
// No cabeçalho das requisições
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

### 2. Validação de Dados
Adicione nós de validação em cada workflow:

```javascript
// Exemplo de validação
if (!$json.dates || !Array.isArray($json.dates)) {
  throw new Error('Invalid dates data');
}
```

## 🚀 Deploy e Configuração

### 1. Variáveis de Ambiente
Configure no React:

```env
REACT_APP_N8N_BASE_URL=https://your-n8n-instance.com/webhook
REACT_APP_API_KEY=your-api-key
```

### 2. Teste de Conectividade
Use o endpoint de health check:

```javascript
// Adicione este workflow para teste
{
  "name": "Health Check",
  "webhook": "/webhook/health",
  "method": "GET",
  "response": { "status": "ok", "timestamp": "{{ new Date().toISOString() }}" }
}
```

## 📊 Monitoramento

### 1. Logs
Configure logs detalhados em cada workflow:

```javascript
// Adicione nó de log
{
  "name": "Log Request",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "console.log('Request received:', JSON.stringify($json, null, 2));\nreturn items;"
  }
}
```

### 2. Notificações
Configure notificações para erros:

```javascript
// Nó de notificação por email/Slack em caso de erro
{
  "name": "Error Notification",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "subject": "Erro no Sistema Cuscuz Solidário",
    "text": "Erro detectado: {{ $json.error }}"
  }
}
```

## 🔄 Sincronização Bidirecional

### 1. Webhook de Mudanças no Google Sheets
Configure triggers para mudanças nas planilhas:

```javascript
// Workflow acionado por mudanças no Google Sheets
{
  "trigger": "googleSheets.onChange",
  "action": "syncToReact"
}
```

### 2. Polling Periódico
Configure sincronização automática a cada 5 minutos:

```javascript
// Workflow com cron trigger
{
  "trigger": {
    "type": "cron",
    "expression": "*/5 * * * *"
  },
  "action": "fullSync"
}
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Erro 404 nos webhooks**
   - Verifique se os workflows estão ativos
   - Confirme as URLs dos webhooks

2. **Dados não sincronizando**
   - Verifique permissões do Google Sheets
   - Confirme IDs das planilhas

3. **Timeout nas requisições**
   - Aumente timeout nos workflows
   - Otimize consultas ao Google Sheets

### Debug
Use o console N8N para debug:
- Visualize execuções dos workflows
- Analise logs de erro
- Teste workflows individualmente

---

**Este guia fornece a base completa para integração N8N com o Sistema Cuscuz Solidário**

