require('dotenv').config();
const https = require('https');

function getModels(host, path, headers) {
    return new Promise((resolve, reject) => {
        https.get({ host, path, headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

(async () => {
    const oaimodels = await getModels('api.openai.com', '/v1/models', { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY, 'User-Agent': 'node' });
    if (oaimodels.data) {
        console.log('OpenAI DALL-E models:', oaimodels.data.filter(m => m.id.includes('dall-e')).map(m => m.id));
    } else {
        console.log('OpenAI error:', oaimodels);
    }

    const gmodels = await getModels('generativelanguage.googleapis.com', '/v1beta/models?key=' + process.env.GEMINI_API_KEY, { 'User-Agent': 'node' });
    if (gmodels.models) {
        console.log('Gemini text models:', gmodels.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')).map(m => m.name));
        console.log('Gemini image models (vision/imagen/predict):', gmodels.models.filter(m => m.name.includes('image') || m.name.includes('vision') || (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('predict'))).map(m => m.name));
        console.log('Gemini all models:', gmodels.models.map(m => m.name));
    } else {
        console.log('Gemini error:', gmodels);
    }
})();
