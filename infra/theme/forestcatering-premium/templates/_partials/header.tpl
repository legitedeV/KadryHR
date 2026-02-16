{extends file='parent:_partials/header.tpl'}

{block name='header_before'}
  <div class="fc-topbar" role="status" aria-live="polite">
    <div class="container fc-topbar__inner">
      <span>{l s='Darmowa dostawa od 299 zł | Ekspresowa obsługa eventów' d='Shop.Theme.Global'}</span>
      <div class="fc-brand-switch" data-brand-switch>
        <button class="fc-brand-switch__btn is-active" type="button" data-brand="forestcatering">ForestCatering</button>
        <button class="fc-brand-switch__btn" type="button" data-brand="forestbar">ForestBar</button>
      </div>
    </div>
  </div>
  {$smarty.block.parent}
{/block}
