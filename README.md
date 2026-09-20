# GranjaSmart — edição acadêmica

Aplicativo web estático para demonstração acadêmica de gestão avícola. Funciona sem login: cada navegador guarda seus próprios registros localmente. O código pode ser publicado no GitHub Pages sem servidor ou banco de dados.

## Recursos disponíveis

- Cadastro de propriedades, galpões e lotes;
- registros de mortalidade, pesagens e alimentação;
- programação de vacinas e tarefas;
- despesas, receitas, vendas e estoque;
- painel com indicadores calculados a partir dos registros;
- alertas de vacinação, tarefas, estoque baixo e validade;
- exportação CSV e backup/restauração JSON;
- instalação como aplicativo web e uso offline após o primeiro carregamento.

## Limites importantes

Os registros ficam no `localStorage` do navegador, **não** em um servidor. Não há contas, sincronização, recuperação automática nem acesso aos mesmos dados em outro aparelho. Limpar os dados do navegador, trocar de aparelho ou desinstalar o navegador pode apagar os registros. Exporte um backup regularmente e guarde-o em local seguro. Não use esta edição como única cópia de dados de produção.

Para testar: abra `index.html` por um servidor HTTP local ou publique os arquivos desta pasta no GitHub Pages. O projeto não usa dados fictícios pré-carregados.

