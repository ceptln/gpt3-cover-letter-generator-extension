const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
            const decodedKey = atob(result['openai-key']);
            resolve(decodedKey);
            }
        });
    });
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
            if (response.status === 'failed') {
            console.log('injection failed.');
            }
        }
        );
    });
};

const generate = async (prompt) => {
    // Get your API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';
      
    // Call completions endpoint
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 1250,
            temperature: 0.7,
        }),
    });
      
    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
  }

const generateCompletionAction = async (info) => {
    try {

        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix = `
        I am writing a cover letter. Fill the following paragraph with the missions below. Your answer should be between 400 and 500 characters, please sum up if needed.

        The paragraph to fill:
        "I am excited by the proposed missions outlined in the job description.  I am eager to contribute by [BLANK TO BE FILLED]. Additionally, I look forward to [BLANK TO BE FILLED]. I find these projects extremely challenging and I want to be part of them and make a meaningful impact and keep learning."

        The missions listed in the job description:
        `;

    const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
    
    sendMessage(baseCompletion.text);
    
    console.log(baseCompletion.text)
    } catch (error) {
        console.log(error);
        sendMessage(error.toString());
    }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate CL paragraph',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);