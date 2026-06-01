import type { Termo } from "@/components";

export const TERMO_DOADOR: Termo = {
  titulo: "Termo de Consentimento do Doador",
  introducao:
    "Leia atentamente as condições abaixo antes de concluir seu cadastro como doador no Alimenta+.",
  secoes: [
    {
      titulo: "1. Uso e tratamento dos seus dados",
      paragrafo:
        "Ao concluir o cadastro de doador, você declara estar ciente de que o Alimenta+ coleta e trata os dados informados — como CNPJ, endereço/ponto de retirada e o histórico de doações — exclusivamente para a operação da plataforma, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Os dados não são comercializados e podem ser excluídos a qualquer momento mediante solicitação.",
    },
    {
      titulo: "2. Responsabilidade pela qualidade dos alimentos",
      paragrafo:
        "Você reconhece ser o único responsável pela procedência, conservação, prazo de validade e adequação sanitária dos alimentos disponibilizados, nos termos da Lei nº 14.016/2020. Compromete-se a doar apenas alimentos próprios para consumo, declarando que:",
      itens: [
        "Os alimentos estão dentro do prazo de validade e adequadamente conservados",
        "As informações de descrição e quantidade são verdadeiras",
        "Não serão doados alimentos deteriorados, contaminados ou impróprios",
      ],
    },
    {
      titulo: "3. Concordância com as regras da plataforma",
      paragrafo:
        "Você concorda em utilizar o Alimenta+ de boa-fé, fornecendo informações verídicas e respeitando as regras da plataforma. É vedado o uso para fins comerciais, revenda de alimentos, fraude ou qualquer conduta que prejudique outros usuários. O descumprimento pode resultar na suspensão ou exclusão da conta.",
    },
    {
      titulo: "4. Isenção de responsabilidade civil",
      paragrafo:
        "O Alimenta+ atua exclusivamente como intermediador digital entre doadores e receptores, não produzindo, transportando nem armazenando alimentos. A plataforma não se responsabiliza, civil ou criminalmente, por eventuais danos decorrentes da qualidade, do estado de conservação ou do consumo dos alimentos doados, sendo tal responsabilidade exclusiva do doador.",
    },
  ],
};
