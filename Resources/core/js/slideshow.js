    var howworks = new Array();
    howworks[0] = 'You can think of a typical city budget as a flow of funds, not unlike your own personal finances. You have income, bank accounts, and expenses. A city has revenue, funds, and expenses.';
    howworks[1] = 'A city\'s revenue comes from taxes, fees, sales, and other sources. That revenue is organized into funds, upon which specific departments and divisions can draw for their expenses. Funds and departments have their own hierarchical structures. For example, the Refuse Fund, the Electric Fund, the Gas Fund, and others are all grouped together as Enterprise Funds. Departments are broken down into divisions. For example, The City Attorney department has an Administrative division, a Consultation and Advisory division, and others.';
    howworks[2] = 'A division or program (and hence the department to which it belongs) can draw on multiple funds. For example, the Purchasing division of the Administrative Services department gets money from the General Fund and the Printing & Mailing Services Fund.';
    howworks[3] = 'Similarly, the same revenue stream can feed into multiple funds. For example, the \'Return on Investments\' revenue type provides money for the General Fund, the Water Fund, and the Capital Improvement Fund, among others.';
    howworks[4] = 'Moreover, a city\'s various departments have the same types of expenses. For example, departments spend money on salaries and benefits for their employees (which is the largest city expenditure category). This allows a budget to offer an additional perspective on a city\'s finances: how much money is being spent on various categories of expenses, instead of a breakdown merely by department or division.';

    var howtops = new Array();
    
    /*
    howtops[0] = 'Delphi Budgets offers the ability to explore a budget in a simple graphical user interface, making it easier than pouring through hundreds of pages of a budget document to get at the information you want about your city\'s finances.';
    howtops[1] = 'The interface is organized into two main panels. The panel on the left contains two columns: one for Fund and the other for Department. These panels filter one another as you make selections, indicating which departments recieve money from which funds, or, conversely, which funds grant money to which departments. You can select a fund first or a department first&mdash;it all depends on what information you need.';
    howtops[2] = 'The right panel displays the data that represents the selections you made in the left panel. Financial data is vizualized in graph form, while employee data (available when only a department is selected) is presented in both graph and tabular forms.';
    howtops[3] = 'Above the graph, you\'ll notice selector buttons that allow you to change the graph breakdown. For example, if you want the graph lines (or pie slices) to represent the different funds, select "Funds", or if you want them to represent different expense types, select "Expenses". This is also where you can choose between financial and employee breakdowns.';
    howtops[4] = 'You can also choose different graph types. There are the traditional pie and line charts, as well as a stacked (or area) chart to illustrate each component\'s contribution to the total, in both absolute numbers and percentages.';
    howtops[5] = 'Hover your mouse over graph data points to get more information.';
    */
    
    howtops[0] = 'Delphi Transparency offers the ability to explore a budget in a simple graphical user interface, making it easier than pouring through hundreds of pages of a budget document to get at the information you want about your city\'s finances. The main view, depicted here, includes a graph, legend, and various controls. By default, it shows you all expenses by all departments out of all funds, broken down by fund.';
    howtops[1] = 'To focus on specific data (like a specific fund, department, expense type, or any combination) or to change how it\'s displayed, use the "Filter" dropdown. The "Filter" dropdown has two main components: (1) the "Show me..." column and (2) the "With the following filters..." columns.';
    howtops[2] = 'The "Show me..." column allows you to specify what you want the lines, pie slices, and table rows to represent on the graph.';
    howtops[3] = 'The "With the following filters..." columns show you the hierarchical relationships of (1) Funds, (2) Departments, and (3) Expenses and Revenues, and allow you to focus in on only the data that\'s relevant to you.';
    howtops[4] = 'Notice that when you toggle the checkboxes in one column, it grays out and enables items in the other columns. This allows you to see the underlying relationships between the data. For example, if a particular department never gets money from a particular fund, then selecting only that department will gray out the fund.';
    howtops[5] = 'When you\'re done choosing your filters, you\'re ready to use the graph. Hover your mouse over any data point to get a tooltip with precise figures for that point.';
    howtops[6] = 'If you\'d like to see a different graph type, select a different one from those that are appropriate for visualizing the data. There are five graph types overall: an area graph, an area graph by percentage, a line graph, a pie graph, and a table.';
    howtops[7] = 'You can also click on any line or legend item to "drill down" and see the graph with the same filters, but only for that item\'s sub-divisions.';
    howtops[8] = 'Clicking on the expand/collapse arrow on items on the legend will break up that item on the graph into its sub-divisions without removing any of the other items. This allows you more flexibility in making various comparisons.';
    howtops[9] = 'Depending on your selections, there may be some annotations to accompany the graphs. These may be information about the department or fund, or perhaps even some notes about how a particular fund gets a certain kind of revenue.';
    howtops[10] = 'Finally, there are options to (1) download the displayed data in various formats and (2) share the current view on Facebook, Twitter, Google+, or by email.';
    
    // these next two variables will let us know which way we want to swipe the slideshow, by letting functions know where we are now (since where we're going is passed in as arguments)
    var currentSection = -1;
    var currentSlide = -1;
    var numSlides = 0;

    // we assume that the howto images are of the form Resources/core/img/howto0.png
    // and the how budgets work images are of the form Resources/core/img/howworks0.png

    function swapImage(section, slide, direction){
        var imgDiv = document.getElement('#slideImg');
        var imgElement = document.getElement('#slideImg img');
        
        // we only want the image to have the sliding transition effect if we're not moving within the how to use section. the reason is that the how to use images are very similar, so it makes more sense to just replace them.
        if (section == 0 && section == currentSection)
        {
            imgElement.setProperty('src', '/Resources/core/img/howto' + slide + '.png');
        }
        else
        {
            var slideOut = new Fx.Tween(imgDiv, {
                property: 'left',
                duration: '500',
                unit: '%',
                transition: Fx.Transitions.Quad.easeInOut
            });
            slideOut.start((direction == 'forward' ? '-100%' : '100%')).chain(function(){
                imgDiv.destroy();
            });
            
            var newImgDiv = imgDiv.clone(true, true).inject(imgDiv.getParent(), 'top');
            
            newImgDiv.setStyle('left', (direction == 'forward' ? '100%' : '-100%'));
            var newImgElement = newImgDiv.getElement('img');
            newImgElement.setProperty('src', '/Resources/core/img/' + (section == 1 ? 'howworks' : 'howto') + slide + '.png');
            
            var slideIn = new Fx.Tween(newImgDiv, {
                property: 'left',
                duration: '500',
                unit: '%',
                transition: Fx.Transitions.Quad.easeInOut
            });
            slideIn.start('5%');
        }
        
    }
    
    function swapText(section, slide, direction){
        var textDiv = document.getElement('#slideText');
        var textElement = document.getElement('#slideText p');
        
        var slideOut = new Fx.Tween(textDiv, {
            property: 'left',
            duration: '500',
            unit: '%',
            transition: Fx.Transitions.Quad.easeInOut
        });
        slideOut.start((direction == 'forward' ? '-100%' : '100%')).chain(function(){
            textDiv.destroy();
        });
        
        var newTextDiv = textDiv.clone(true, true).inject(textDiv.getParent(), 'top');
        
        newTextDiv.setStyle('left', (direction == 'forward' ? '100%' : '-100%'));
        var newTextElement = newTextDiv.getElement('p');
        if (section == 1)
        {
            newTextElement.setProperty('html', howworks[slide]);
        }
        else
        {
            newTextElement.setProperty('html', howtops[slide]);
        }
        
        var slideIn = new Fx.Tween(newTextDiv, {
            property: 'left',
            duration: '500',
            unit: '%',
            transition: Fx.Transitions.Quad.easeInOut
        });
        slideIn.start('5%');
    }
    
    function initializeDots(section, slide){
        var progressDotsElement = document.getElement('#progressDots');
        
        // kill all the existing dots
        progressDotsElement.getChildren().each(function(child){child.destroy();});
        
        // recreate what's necessary
        numDots = (section == 1 ? howworks.length : howtops.length);
        for (var i = 0; i < numDots; i++)
        {
            var newDot = new Element('li').inject(progressDotsElement);
            if (i == slide)
            {
                newDot.addClass('active');
            }
            (function(){
                var index = i;
                newDot.addEvent('click', function(){
                    activateSlide(section, index);
                    });
            })();
        }
    }
    
    function initializeNavArrow(whichOne, section, slide){
        navArrow = document.getElement('#' + whichOne);
        
        // clear everything
        navArrow.removeEvents();
        if (navArrow.hasClass('disabled'))
        {
            navArrow.removeClass('disabled');
        }
        
        if ((slide == 0 && whichOne == 'goLeft') || (slide == (numSlides - 1) && whichOne == 'goRight'))
        {
            navArrow.addClass('disabled')
        }
        else
        {
            navArrow.addEvent('click', function(){
                activateSlide(section, (whichOne == 'goLeft' ? (slide - 1) : (slide + 1)));
            });
        }
    }
    
    function forwardOrBackward(section, slide)
    {
        if (section > currentSection)
            return 'forward';
        else if (section < currentSection)
            return 'backward';
        else if (section == currentSection){
            if (slide >= currentSlide)
                return 'forward';
            else
                return 'backward';
        }
    }
    
    function activateSlide(section, slide){
            /*  things that need to happen:
                
                1. set the correct section tab to active and deactivate the other tabs
                
                2. swipe away the previous image and swipe in the correct image
                
                3. swipe away the previous text and swipe in the correct text
                
                4. clear the dots and re-create them (since we may have switched to a different section), with the right active/inactive states
                
                5. update the action associated with the left and right arrows
            
            */
            
        var direction = forwardOrBackward(section, slide);
        numSlides = (section == 1 ? howworks.length : howtops.length);
        
        swapImage(section, slide, direction);
        swapText(section, slide, direction);
        initializeDots(section, slide);
        initializeNavArrow('goLeft', section, slide);
        initializeNavArrow('goRight', section, slide);
        
        currentSection = section;
        currentSlide = slide;
    }
    
    function initializeSlideshowActions(){
        //this snippet adds functionality to the mouse scroll wheel
        document.addEvent('mousewheel', function(event){            
            // mouse wheel up
            if (event.wheel > 0 && currentSlide > 0)
            {
                activateSlide(currentSection, (currentSlide - 1));
            }
            // mouse wheel down
            else if (event.wheel < 0 && currentSlide < (numSlides - 1))
            {
                activateSlide(currentSection, (currentSlide + 1));
            }
        });
        
        //this snippet adds functionality to the keyboard left and right arrows
        document.addEvent('keyup', function(event){
            if (event.key == 'left' && currentSlide > 0)
            {
                activateSlide(currentSection, (currentSlide - 1));
            }
            else if (event.key == 'right' && currentSlide < (numSlides - 1))
            {
                activateSlide(currentSection, (currentSlide + 1));
            }
        });
    }
