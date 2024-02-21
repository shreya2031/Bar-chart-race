<script>
  import Chart from "./Chart.svelte";
</script>

<main>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Annapurna+SIL:wght@400;700&family=Inter:wght@100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

  <section class="intro">
    <h1>Sources of Electricity</h1>
  
    <p>
      
      Percentage breakdown of different energy sources utilized for electricity production throughout the world between 1989 and 2021.
     Check out the design overview <strong><a href="design.html"> here</a></strong>.
    
    </p>
  </section>

  <Chart />

  <section class="outro">
    <p>
      Data from <a
        href="https://github.com/owid/energy-data?tab=readme-ov-file#data-on-energy-by-our-world-in-data"
        >Our world in data</a
      >. This visualization was created for the <strong>DSC 106: Intro to Data visualization </strong> course.
    </p>

  </section>
</main>

<style>


  

  main {
    padding: 0 1em;
    max-width: 50em;
    margin: 0 auto;
    font-family: "Roboto Condensed", sans-serif;
    font-optical-sizing: auto;
    font-weight: 300;
    font-style: normal;
    font-variation-settings:
    "slnt" 0;

  }

  .intro {
    text-align: center;
    margin: 1em 0;
    
  }

  .intro h1 {
    font-weight: 600;
    font-size: 3em;
    margin: 0;
  }

  .intro p {
    margin-top: 10px;
    font-size: 1.5em;
    font-style: italic;
   
  }

  .outro {
    margin-top: 3em;
    border-top: 1px solid gray;
  }

  .outro p {
    line-height: 1.2;
    font-weight: 300;
    font-size: 1.3em;
  }
</style>
