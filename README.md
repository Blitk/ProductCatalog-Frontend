
# ProductCatalog Frontend

Interface web do **ProductCatalog**, uma aplicação de catálogo de produtos desenvolvida com HTML5, CSS3 e JavaScript puro (Vanilla JS), integrada a uma API REST construída com Java e Spring Boot.

O projeto possui duas áreas independentes: uma vitrine pública para consulta de produtos e um painel administrativo para gerenciamento do catálogo.

## Funcionalidades

### Vitrine pública

- Listagem de produtos cadastrados.
- Visualização dos detalhes de cada produto.
- Busca de produtos por nome.
- Filtro por categoria.
- Ordenação de produtos.
- Paginação de resultados.
- Exibição de imagens dos produtos.
- Tratamento de estados de carregamento, erros e resultados vazios.

### Painel administrativo

- Dashboard com indicadores do catálogo.
- Listagem e gerenciamento de produtos.
- Cadastro e edição de produtos.
- Exclusão de produtos.
- Upload e remoção de imagens.
- Gerenciamento de categorias.
- Paginação e busca de produtos.
- Feedback visual para operações e erros.

## Tecnologias utilizadas

- **HTML5** — estrutura das páginas.
- **CSS3** — estilização e responsividade.
- **JavaScript (ES Modules)** — lógica e integração com a API.
- **Fetch API** — comunicação HTTP com o backend.
- **URLSearchParams** — construção de parâmetros de consulta.
- **FormData** — envio de imagens.
- **Python HTTP Server** — servidor local para desenvolvimento.

O projeto não utiliza frameworks JavaScript ou bibliotecas externas de interface.

## Estrutura do projeto

```text
product-catalog-frontend/
│
├── index.html
│
├── store/
│   ├── index.html
│   ├── product.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── layout.css
│   │   ├── responsive.css
│   │   └── product.css
│   │
│   └── js/
│       ├── app.js
│       ├── catalog.js
│       ├── product.js
│       └── services/
│           └── productService.js
│
├── admin/
│   ├── index.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── responsive.css
│   │
│   └── js/
│       ├── app.js
│       ├── router.js
│       ├── dashboard.js
│       ├── products.js
│       ├── categories.js
│       │
│       ├── services/
│       │   ├── productService.js
│       │   └── categoryService.js
│       │
│       └── components/
│           ├── sidebar.js
│           ├── modal.js
│           ├── productModal.js
│           ├── pagination.js
│           └── notifications.js
│
├── shared/
│   └── js/
│       ├── config.js
│       └── api.js
│
└── assets/
    ├── css/
    │   └── style.css
    └── images/
        └── no-image.png
```

## Arquitetura

O frontend foi organizado para separar responsabilidades e facilitar a manutenção.

### Store

Responsável pela experiência pública de consulta ao catálogo.

- `index.html`: página principal da vitrine.
- `product.html`: página de detalhes do produto.
- `catalog.js`: gerenciamento da listagem, filtros e paginação.
- `product.js`: apresentação dos detalhes do produto.
- `services/productService.js`: comunicação com os endpoints de produtos.

### Admin

Responsável pelo gerenciamento do catálogo.

- `index.html`: estrutura do painel administrativo.
- `app.js`: inicialização dos módulos.
- `router.js`: navegação entre as páginas administrativas.
- `dashboard.js`: indicadores e produtos recentes.
- `products.js`: gerenciamento da listagem de produtos.
- `categories.js`: gerenciamento de categorias.
- `services/`: comunicação com os endpoints da API.
- `components/`: componentes reutilizáveis da interface.

### Shared

Contém recursos compartilhados entre a vitrine e o painel administrativo.

- `config.js`: configurações da aplicação.
- `api.js`: centralização das requisições HTTP e tratamento de erros.

## Integração com o Backend

O frontend depende do backend ProductCatalog API para consultar e gerenciar os dados.

**Configuração da API**

Arquivo: `shared/js/config.js`

```javascript
export const API_BASE_URL = "http://localhost:8080/api";
export const API_SERVER_URL = "http://localhost:8080";
export const DEFAULT_PAGE_SIZE = 12;
```

### Endpoints utilizados

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/{id}` | Buscar produto |
| GET | `/api/products/search` | Buscar por nome |
| GET | `/api/products/filter` | Filtrar produtos |
| GET | `/api/products/category/{id}` | Produtos por categoria |
| POST | `/api/products` | Cadastrar produto |
| PUT | `/api/products/{id}` | Atualizar produto |
| DELETE | `/api/products/{id}` | Excluir produto |
| POST | `/api/products/{id}/image` | Enviar imagem |
| DELETE | `/api/products/{id}/image` | Remover imagem |
| GET | `/api/categories` | Listar categorias |
| GET | `/api/categories/{id}` | Buscar categoria |
| POST | `/api/categories` | Cadastrar categoria |
| PUT | `/api/categories/{id}` | Atualizar categoria |
| DELETE | `/api/categories/{id}` | Excluir categoria |

## Como executar localmente

### Pré-requisitos

- Backend ProductCatalog API configurado e em execução.
- Java 21 e PostgreSQL, conforme os requisitos do backend.
- Python 3 instalado.
- Navegador moderno.

### 1. Inicie o Backend

Execute o backend e confirme que a API está disponível em:

```text
http://localhost:8080
```

### 2. Configure a URL da API

Confira as configurações em:

```text
shared/js/config.js
```

Para execução local, utilize:

```javascript
export const API_BASE_URL = "http://localhost:8080/api";
export const API_SERVER_URL = "http://localhost:8080";
export const DEFAULT_PAGE_SIZE = 12;
```

### 3. Inicie o servidor do Frontend

Na raiz do projeto, execute:

```bash
python3 -m http.server 5500
```

### 4. Acesse a aplicação

**Página inicial:**

http://localhost:5500

**Vitrine pública:**

http://localhost:5500/store/

**Painel administrativo:**

http://localhost:5500/admin/

## Tratamento de erros

A comunicação com a API é centralizada no módulo `shared/js/api.js`.

O módulo é responsável por:

- Executar requisições HTTP.
- Serializar dados JSON.
- Enviar arquivos utilizando `FormData`.
- Interpretar respostas da API.
- Tratar respostas HTTP com erro.
- Disponibilizar uma classe `ApiError` com o código HTTP da resposta.

As páginas utilizam essas informações para apresentar mensagens adequadas ao usuário.

## Responsividade

As interfaces foram desenvolvidas considerando diferentes tamanhos de tela, incluindo dispositivos móveis e desktops.

A organização dos estilos em arquivos separados facilita a manutenção e a evolução visual da aplicação.

## Observações

- O frontend depende da API para funcionar corretamente.
- O painel administrativo não possui autenticação nesta versão.
- As imagens dos produtos são armazenadas e servidas pelo backend.
- O servidor Python é utilizado apenas para desenvolvimento local.
- Para publicação em produção, é necessário configurar as URLs da API e um servidor web apropriado.
- A configuração de CORS do backend deve permitir a origem utilizada pelo frontend.

## Projeto relacionado

**ProductCatalog API**

Backend desenvolvido com Java 21, Spring Boot, Maven e PostgreSQL.

[Repositório do Backend](https://github.com/Blitk/ProductCatalog-API)

---

Projeto desenvolvido para fins de aprendizado e portfólio, com foco em desenvolvimento web, integração com APIs REST e organização de código utilizando JavaScript puro.
