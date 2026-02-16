{extends file='parent:index.tpl'}

{block name='page_content_container'}
  {assign var='is_polish' value=($language.iso_code|default:'en' == 'pl')}
  <section class="fc-hero" data-animate="fade-up">
    <div class="container fc-hero__grid">
      <div class="fc-hero__content" data-brand-content="forestcatering">
        <p class="fc-eyebrow">ForestCatering</p>
        <h1>{if $is_polish}Catering premium dla firm i eventów{else}Premium catering for business and events{/if}</h1>
        <p>{if $is_polish}Od śniadań zarządu po gale i premiery – dostarczamy menu szyte na miarę z serwisem klasy premium.{else}From executive breakfasts to gala evenings — bespoke menus with premium service.{/if}</p>
        <div class="fc-hero__actions">
          <a href="{$urls.pages.contact}" class="btn btn-primary">{if $is_polish}Zamów konsultację{else}Book a consultation{/if}</a>
          <a href="#featured-products" class="btn btn-outline-primary">{if $is_polish}Zobacz ofertę{else}See our offer{/if}</a>
        </div>
      </div>
      <div class="fc-hero__content is-hidden" data-brand-content="forestbar">
        <p class="fc-eyebrow">ForestBar</p>
        <h1>{if $is_polish}Mobilny koktajl bar na eventy premium{else}Premium mobile cocktail bar for events{/if}</h1>
        <p>{if $is_polish}Autorskie koktajle, flair bartending i pełna obsługa baru dla konferencji, wesel i imprez firmowych.{else}Signature cocktails, flair bartending and complete event bar service for conferences and private events.{/if}</p>
      </div>
      <div class="fc-hero__figure" data-animate="float-in">
        <img src="{$urls.theme_assets}svg/hero-suit.svg" alt="ForestCatering hero illustration" loading="eager" width="520" height="460">
      </div>
    </div>
  </section>

  <section class="fc-features container" data-animate="fade-up">
    <article class="fc-card"><h3>{if $is_polish}Terminowa dostawa{else}On-time delivery{/if}</h3><p>{if $is_polish}Logistyka oparta na slotach i live ETA.{else}Slot-based logistics and live ETA.{/if}</p></article>
    <article class="fc-card"><h3>{if $is_polish}Obsługa eventowa{else}Event service{/if}</h3><p>{if $is_polish}Kompletny serwis kelnerski i barowy.{else}Full waiter and bar operations.{/if}</p></article>
    <article class="fc-card"><h3>{if $is_polish}Menu custom{else}Custom menus{/if}</h3><p>{if $is_polish}Diety, alergeny i preferencje gości pod kontrolą.{else}Dietary needs and allergens handled with care.{/if}</p></article>
  </section>

  <section class="fc-categories container" data-animate="fade-up">
    <a class="fc-tile" href="{$urls.base_url|escape:'html':'UTF-8'}">Catering</a>
    <a class="fc-tile" href="{$urls.base_url|escape:'html':'UTF-8'}">Lunch box</a>
    <a class="fc-tile" href="{$urls.base_url|escape:'html':'UTF-8'}">Bankiety</a>
    <a class="fc-tile" href="{$urls.base_url|escape:'html':'UTF-8'}">ForestBar</a>
  </section>

  <section id="featured-products" class="fc-featured-products container" data-animate="fade-up">
    <div class="fc-section-head">
      <h2>{if $is_polish}Polecane produkty{else}Featured products{/if}</h2>
    </div>
    {hook h='displayHome'}
  </section>

  <section class="fc-testimonials" data-animate="fade-up">
    <div class="container fc-testimonials__grid">
      <blockquote>„{if $is_polish}Idealna organizacja i wybitna jakość, nasi goście byli zachwyceni.{else}Flawless organization and outstanding quality, our guests loved it.{/if}”</blockquote>
      <blockquote>„{if $is_polish}ForestBar zrobił show na premierze produktu.{else}ForestBar stole the show during our product launch.{/if}”</blockquote>
      <blockquote>„{if $is_polish}Najlepszy partner cateringowy B2B, z jakim współpracowaliśmy.{else}The best B2B catering partner we have worked with.{/if}”</blockquote>
    </div>
  </section>
{/block}
