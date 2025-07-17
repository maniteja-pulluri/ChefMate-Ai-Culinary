const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateImage(prompt) {
  try {
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5
        }
      }
    );
    
    return output[0]; // Returns the URL of the generated image
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error('Failed to generate image');
  }
}

module.exports = {
  generateImage
};