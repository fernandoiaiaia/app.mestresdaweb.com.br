import type { MetadataRoute } from "next";

/**
 * advisor.mestresdaweb.com.br — ferramenta interna, nunca deve aparecer na busca.
 *
 * ATENCAO ao `allow`: parece contraditorio, mas e proposital.
 *
 * Em 27/08/2026 a tela de login deste app estava INDEXADA no Google
 * (confirmado no Search Console de mestresdaweb.com.br, que e propriedade de
 * dominio e portanto cobre todos os subdominios). Para tirar uma URL ja
 * indexada, o Google precisa RASTREAR a pagina de novo e ler o cabecalho
 * `X-Robots-Tag: noindex` que passamos em next.config.ts. Um `Disallow: /`
 * aqui impediria esse rastreamento — e a URL ficaria presa no indice, sem
 * conteudo, por tempo indeterminado. E o erro classico de quem tenta
 * desindexar com robots.txt.
 *
 * Sequencia correta, entao:
 *   1. AGORA — noindex no cabecalho + rastreamento liberado (este arquivo)
 *   2. Search Console > Remocoes: pedir a remocao de advisor.mestresdaweb.com.br
 *      para acelerar (a remocao manual dura ~6 meses, o noindex e o que
 *      resolve de forma permanente)
 *   3. QUANDO o Search Console confirmar que saiu do indice, trocar o bloco
 *      abaixo por `disallow: "/"` e apagar este comentario.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}
