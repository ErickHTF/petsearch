// Privacy policy (PRV-07), about page (FR-22, PRV-10) and not-found page.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PRIVACY_POLICY_VERSION } from '@petsearch/shared';
import { formatDate } from '../lib/format.ts';
import { useTitle } from '../lib/hooks.ts';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-2 grid gap-2">{children}</div>
    </section>
  );
}

export function Privacy() {
  useTitle('Privacidade');
  return (
    <article>
      <h1 className="text-2xl font-bold">Política de privacidade</h1>
      <p className="mt-1 text-sm text-muted">Versão de {formatDate(PRIVACY_POLICY_VERSION)}.</p>
      <p className="mt-3">
        O PETSEARCH é um protótipo acadêmico. Tratamos o mínimo de dados necessário para ajudar
        animais perdidos a voltarem para casa, de acordo com a Lei Geral de Proteção de Dados (LGPD,
        Lei 13.709/2018).
      </p>

      <Section title="Quem é responsável">
        <p>
          Grupo de estudantes do curso de Tecnologia em Análise e Desenvolvimento de Sistemas do
          IFSP Campus Salto, no projeto de extensão do 2º semestre de 2026, sob coordenação do Prof.
          Leonel Cardoso Leal.
        </p>
      </Section>

      <Section title="Quais dados usamos e por quê">
        <ul className="list-disc pl-5">
          <li>
            <strong>Conta:</strong> nome de exibição, e-mail e senha (guardada de forma
            criptografada). Servem só para você entrar e gerenciar seus avisos. Não aparecem nos
            avisos.
          </li>
          <li>
            <strong>Avisos:</strong> fotos e características do animal, bairro e data. São públicos
            para ajudar na busca. Não pedimos endereço, telefone nem CPF.
          </li>
          <li>
            <strong>Avistamentos e mensagens:</strong> o que a pessoa descreveu e, se ela quiser, um
            contato. São vistos apenas por quem publicou o aviso e pela moderação (que vê só que um
            contato foi informado, não o contato).
          </li>
          <li>
            <strong>Segurança:</strong> registros técnicos mínimos para evitar abuso, como limite de
            envios.
          </li>
        </ul>
      </Section>

      <Section title="Base legal">
        <p>
          Usamos seus dados com o seu consentimento (art. 7º, I, da LGPD), dado ao marcar a caixa de
          autorização. Registros mínimos de segurança se baseiam no legítimo interesse.
        </p>
      </Section>

      <Section title="Fotos e localização">
        <p>
          Ao publicar, a localização gravada dentro das fotos é apagada. Mostramos só o bairro,
          nunca o endereço. Evite fotos com pessoas, placas de carro ou número de casas.
        </p>
      </Section>

      <Section title="Por quanto tempo guardamos">
        <ul className="list-disc pl-5">
          <li>Avisos reencontrados ou encerrados saem da lista pública na hora.</li>
          <li>Ao excluir um aviso, as fotos e os avistamentos recebidos são apagados junto.</li>
          <li>Ao excluir a conta, todos os seus dados e avisos são apagados.</li>
          <li>
            Os prazos de exclusão automática de avisos antigos ainda estão em definição pelo grupo.
          </li>
        </ul>
      </Section>

      <Section title="Seus direitos">
        <p>
          Você pode editar ou excluir seus avisos a qualquer momento e excluir sua conta em{' '}
          <Link to="/minha-conta" className="underline underline-offset-2">
            Minha conta
          </Link>
          . Para outros pedidos previstos no art. 18 da LGPD, use o canal de contato abaixo.
        </p>
        <p className="rounded-lg bg-warning-soft p-3 text-warning-ink">
          Canal de contato para pedidos de privacidade: em definição pelo grupo.
        </p>
      </Section>

      <Section title="Dados de exemplo">
        <p>Avisos marcados como “Exemplo fictício” não se referem a animais nem a pessoas reais.</p>
      </Section>
    </article>
  );
}

export function About() {
  useTitle('Sobre');
  return (
    <article>
      <h1 className="text-2xl font-bold">Sobre o PETSEARCH</h1>
      <p className="mt-3">
        O PETSEARCH organiza avisos de animais perdidos e encontrados em Indaiatuba (SP). Quem
        perdeu um animal publica um aviso; quem viu um animal procura por bairro e características e
        envia um avistamento; quem publicou confere e atualiza o caso.
      </p>

      <Section title="Projeto acadêmico">
        <p>
          Projeto de extensão “Soluções Tecnológicas para a Comunidade” do curso de Tecnologia em
          Análise e Desenvolvimento de Sistemas do IFSP Campus Salto, 5º semestre, 2º semestre de
          2026. Este site é um protótipo em desenvolvimento.
        </p>
      </Section>

      <Section title="Dados de exemplo">
        <p>
          Os avisos marcados como “Exemplo fictício”, como o da cadela Luna, são inventados para
          demonstrar e testar o protótipo.
        </p>
      </Section>

      <Section title="UPAR">
        <p>
          A UPAR (União Protetora dos Animais de Rua), de Indaiatuba, foi uma referência pesquisada
          pelo grupo. Não há parceria nem contato confirmado com a UPAR, e este site não fala em
          nome dela.
        </p>
      </Section>

      <Section title="Privacidade">
        <p>
          O contato de quem publica é protegido e mostramos só o bairro.{' '}
          <Link to="/privacidade" className="underline underline-offset-2">
            Leia a política de privacidade
          </Link>
          .
        </p>
      </Section>
    </article>
  );
}

export function NotFound() {
  useTitle('Página não encontrada');
  return (
    <div className="card p-5">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2">O endereço pode estar errado ou a página foi removida.</p>
      <Link to="/" className="btn btn-primary btn-block mt-4">
        Ir para o início
      </Link>
    </div>
  );
}
