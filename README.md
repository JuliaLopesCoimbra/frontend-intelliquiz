IntelliQuiz 🎓✨
Objetivo do Projeto

O IntelliQuiz é uma plataforma interativa de quizzes que permite aos usuários criar, responder e gerenciar quizzes personalizados. A proposta é oferecer uma experiência gamificada e dinâmica para aprendizado, treinamento e diversão, tanto em ambientes acadêmicos quanto corporativos.

Tecnologias Utilizadas

Front-end: Next.js (React, TailwindCSS, Shadcn/UI)

Estrutura do Código-Fonte e Minha Contribuição
Parte que desenvolvi (Front-end)

Neste fork, fui responsável pelo desenvolvimento da interface principal em Next.js, com foco nas rotas e funcionalidades essenciais para interação do usuário:

/signin → Página de login com autenticação integrada ao backend.

/signup → Página de cadastro com validação de dados.

/dashboard → Painel do usuário para visualização de quizzes criados e respondidos.

/create → Página para criação de novos quizzes, com campos dinâmicos para perguntas e respostas.

Integração com o Projeto Final

O código-fonte que desenvolvi se integra ao projeto final da seguinte forma:

As rotas do front-end consomem as APIs criadas no back-end (FastAPI), garantindo que o usuário possa cadastrar, autenticar-se e interagir com quizzes.

A dashboard será conectada ao banco de dados via API, exibindo em tempo real os quizzes criados e os resultados obtidos.

A parte de criação de quizzes (/create) fornece os formulários estruturados que, ao serem enviados, alimentam a base de dados central do projeto, compondo o módulo de conteúdo dinâmico.

Links Importantes

Repositório Central da Organização: IntelliQuiz Central

Meu Fork: Julia Lopes Coimbra - IntelliQuiz Frontend
