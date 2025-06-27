document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('personalitySurvey');
    const resultsArea = document.getElementById('resultsArea');
    const resultsJson = document.getElementById('resultsJson');
    const downloadButton = document.getElementById('downloadAnswers');

    // Handle conditional display of 'Other' input fields
    const relationshipSelect = document.getElementById('q_relationship');
    const relationshipOtherLabel = document.querySelector('label[for="q_relationship_other"]');
    const relationshipOtherInput = document.getElementById('q_relationship_other');

    relationshipSelect.addEventListener('change', function() {
        if (this.value === 'Other') {
            relationshipOtherLabel.style.display = 'block';
            relationshipOtherInput.style.display = 'block';
        } else {
            relationshipOtherLabel.style.display = 'none';
            relationshipOtherInput.style.display = 'none';
            relationshipOtherInput.value = ''; // Clear if not 'Other'
        }
    });

    const commStyleSelect = document.getElementById('q_comm_style');
    const commStyleOtherLabel = document.querySelector('label[for="q_comm_style_other"]');
    const commStyleOtherInput = document.getElementById('q_comm_style_other');

    commStyleSelect.addEventListener('change', function() {
        if (this.value === 'Other') {
            commStyleOtherLabel.style.display = 'block';
            commStyleOtherInput.style.display = 'block';
        } else {
            commStyleOtherLabel.style.display = 'none';
            commStyleOtherInput.style.display = 'none';
            commStyleOtherInput.value = ''; // Clear if not 'Other'
        }
    });

    // Initialize range output values
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        if(input.nextElementSibling && input.nextElementSibling.tagName === 'OUTPUT'){
            input.nextElementSibling.value = input.value;
        }
    });


    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent actual form submission

        const formData = new FormData(form);
        const surveyData = {};
        const questions = form.querySelectorAll('[name]');

        const questionLabels = {};
        document.querySelectorAll('.question > label[for], .question > fieldset > legend').forEach(labelEl => {
            if (labelEl.tagName === 'FIELDSET') { // For legends
                 // Heuristic: try to find a relevant control for the legend or use a generic name
                const firstControl = labelEl.parentNode.querySelector('input, select, textarea');
                if (firstControl && firstControl.name) {
                    // This is tricky, as legends don't have a single 'for'.
                    // We'll associate it with the first question in the fieldset for now for context.
                }
            } else { // For labels
                const forAttr = labelEl.getAttribute('for');
                if (forAttr) {
                     // Simple text content for most labels
                    let labelText = labelEl.textContent.trim();
                    // For radio buttons, the main question is often not directly linked via 'for' to all inputs
                    if (labelEl.parentNode.classList.contains('question') && labelEl.parentNode.querySelectorAll('input[type="radio"]').length > 0) {
                        // Find the first label in the question div that is not for a radio button itself
                        const mainLabel = labelEl.parentNode.querySelector('label:not([for*="yes"]):not([for*="no"])');
                        if (mainLabel) labelText = mainLabel.textContent.trim();
                    }
                     questionLabels[forAttr] = labelText;
                }
            }
        });


        for (let [key, value] of formData.entries()) {
            // Handle cases where 'Other' text input should override the 'Other' select value
            if (key.endsWith('_other') && value.trim() !== '') {
                const selectKey = key.replace('_other', '');
                if (formData.get(selectKey) === 'Other') {
                    surveyData[selectKey] = `Other: ${value.trim()}`;
                    continue; // Skip adding the _other key itself
                }
            }
            // Skip _other fields if they were not the active choice or are empty
            if (key.endsWith('_other')) {
                const selectKey = key.replace('_other', '');
                 if (formData.get(selectKey) !== 'Other' || value.trim() === '') {
                    continue;
                 }
            }

            // Group three words for question 17
            if (key.startsWith('q_three_words')) {
                if (!surveyData['q_three_words']) {
                    surveyData['q_three_words'] = [];
                }
                if(value.trim() !== '') surveyData['q_three_words'].push(value.trim());
                continue;
            }

            // For radio buttons, get the selected value's label if possible
            if (form.querySelector(`input[name="${key}"][type="radio"]`)) {
                const checkedRadio = form.querySelector(`input[name="${key}"]:checked`);
                if (checkedRadio) {
                    surveyData[key] = checkedRadio.value;
                } else {
                    surveyData[key] = "Not answered";
                }
            } else {
                 surveyData[key] = value.trim();
            }
        }

        // Consolidate q_three_words if it exists
        if (surveyData['q_three_words'] && Array.isArray(surveyData['q_three_words'])) {
            surveyData['q_three_words'] = surveyData['q_three_words'].join(', ');
            if(surveyData['q_three_words'] === '') delete surveyData['q_three_words'];
        }


        // Prepare data with full question text for better readability
        const surveyDataWithFullQuestions = {};
        for (const key in surveyData) {
            let questionText = key; // Fallback to key name
            const inputElement = form.querySelector(`[name="${key}"]`);

            if (inputElement) {
                let questionContainer = inputElement.closest('.question');
                if (questionContainer) {
                    const labelElement = questionContainer.querySelector('label:not(.other-label)'); // Get the main label
                    if (labelElement) {
                        questionText = labelElement.textContent.trim().replace(/:$/, ''); // Remove trailing colon
                    }
                }
            }
            surveyDataWithFullQuestions[questionText] = surveyData[key];
        }


        // Display results
        resultsJson.textContent = JSON.stringify(surveyDataWithFullQuestions, null, 2);
        resultsArea.style.display = 'block';

        // Store in localStorage (optional)
        localStorage.setItem('personalitySurveyAnswers', JSON.stringify(surveyDataWithFullQuestions));

        alert('Thank you for your feedback! Your answers have been recorded (displayed below and saved to local storage).');
        // form.reset(); // Optionally reset the form
    });

    downloadButton.addEventListener('click', function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(resultsJson.textContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "personality_survey_answers.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

});
