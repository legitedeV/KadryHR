{extends file='parent:_partials/footer.tpl'}

{block name='footer_after'}
  {$smarty.block.parent}
  <section class="fc-cta-strip" aria-label="Kontakt">
    <div class="container fc-cta-strip__inner">
      <p class="fc-cta-strip__title">{l s='Skontaktuj się z nami: +48 600 100 200 • hello@forestcatering.pl' d='Shop.Theme.Global'}</p>
      <a href="mailto:hello@forestcatering.pl" class="btn btn-primary">{l s='Napisz do nas' d='Shop.Theme.Actions'}</a>
    </div>
  </section>
{/block}
