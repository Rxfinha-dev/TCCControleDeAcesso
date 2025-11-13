TCCControleDeAcesso

Sistema de Controle de Acesso desenvolvido como Trabalho de Conclusão de Curso (TCC) na ETEC Joaquim Ferreira do Amaral.
O objetivo do sistema é gerenciar cadastros de usuários, autorizações e registros de entrada/saída em um ambiente institucional.

📖 Sumário

Descrição

Objetivos do Projeto

Tecnologias Utilizadas

Funcionalidades Principais

Como Executar o Projeto

Estrutura do Projeto

Capturas de Tela

Contribuição

Licença

Autor

🧩 Descrição

O TCCControleDeAcesso é um sistema desktop desenvolvido em C# com Windows Forms que utiliza um banco de dados MySQL para controlar o acesso de pessoas em uma instituição.
Ele permite o cadastro de usuários, autenticação, registro de entradas e saídas e administração de permissões de acesso, com interface intuitiva e relatórios.

🎯 Objetivos do Projeto

Facilitar o controle de entrada e saída de alunos, professores e visitantes.

Prover um sistema seguro de autenticação e autorização.

Registrar logs de acesso com data e hora.

Fornecer relatórios administrativos.

Criar uma base sólida para expansão futura (como uso de RFID ou QR Code).

🛠️ Tecnologias Utilizadas
Tipo	Tecnologia
Linguagem	C# (.NET Framework)
Interface	Windows Forms (WinForms)
Banco de Dados	MySQL
IDE	Visual Studio
Controle de Versão	Git + GitHub

⚙️ Funcionalidades Principais

✅ Cadastro de usuários (alunos, professores, visitantes)
✅ Login e autenticação segura
✅ Registro de entradas e saídas com data/hora
✅ Controle de níveis de acesso
✅ Ativação e desativação de contas
✅ Edição e exclusão de cadastros
✅ Geração de relatórios administrativos

🚀 Como Executar o Projeto

Clone o repositório

git clone https://github.com/Rxfinha-dev/TCCControleDeAcesso.git


Abra o projeto

No Visual Studio, abra o arquivo TCCControleDeAcesso.sln.

Configure a conexão com o banco MySQL

Localize o trecho de código com a connection string e edite conforme seu ambiente:

server=localhost; database=controleacesso; uid=root; pwd=senha;


Crie o banco de dados

Execute o script SQL (se houver) para criar as tabelas necessárias.

Compile e execute

Pressione F5 ou clique em Iniciar Depuração no Visual Studio.

🗂️ Estrutura do Projeto
TCCControleDeAcesso/
│
├── TCCControleDeAcesso.sln           # Solução principal
├── TCCControleDeAcesso/              # Código-fonte do sistema
│   ├── Forms/                        # Telas e formulários
│   ├── Classes/                      # Classes auxiliares
│   ├── Program.cs                    # Ponto de entrada
│   └── App.config                    # Configurações (banco de dados)
│
├── Images/                           # Prints e ilustrações
├── .gitignore
├── .gitattributes
└── README.md

🖼️ Capturas de Tela

(Adicione imagens reais do sistema aqui — telas de login, cadastro, relatórios etc.)

Exemplo:

![Tela de Login](Images/tela-login.png)
![Tela de Cadastro](Images/tela-cadastro.png)

🤝 Contribuição

Contribuições são bem-vindas!
Para contribuir:

Faça um fork do projeto.

Crie uma nova branch para sua modificação:

git checkout -b feature/minha-feature


Faça suas alterações e commits:

git commit -m "Adiciona nova funcionalidade X"


Envie para seu fork e abra um Pull Request.


👥 Autores:

Bruno Freitas
📫 GitHub: @BrunoFreitas09

Rafael Oliveira
📫 GitHub: @Rxfinha-dev

Leonidas Pelegrini
📫 GitHub: @oleopelegrini

Diego Natan
📫 GitHub: @dnatanno

💡 Projeto desenvolvido para o TCC do curso técnico da ETEC Joaquim Ferreira do Amaral.
