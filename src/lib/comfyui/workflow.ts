import txt2imgTemplate from './workflows/txt2img-basic.json';

import type { ComfyWorkflow } from '@/types/comfyui';

type Txt2ImgParams = {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  seed: number;
};

export function buildTxt2ImgWorkflow({
  prompt,
  negativePrompt = '',
  width,
  height,
  steps,
  cfg,
  sampler,
  seed,
}: Txt2ImgParams): ComfyWorkflow {
  const workflow = structuredClone(txt2imgTemplate) as ComfyWorkflow;
  const samplerNode = findNodeByClass(workflow, 'KSampler');
  const positiveNode = findLinkedNode(workflow, samplerNode?.inputs.positive);
  const negativeNode = findLinkedNode(workflow, samplerNode?.inputs.negative);
  const latentNode = findNodeByClass(workflow, 'EmptyLatentImage');

  if (!positiveNode || !negativeNode || !latentNode || !samplerNode) {
    throw new Error('Txt2Img workflow template is missing required nodes');
  }

  positiveNode.inputs.text = prompt;
  negativeNode.inputs.text = negativePrompt;
  latentNode.inputs.width = width;
  latentNode.inputs.height = height;
  latentNode.inputs.batch_size = 1;
  samplerNode.inputs.steps = steps;
  samplerNode.inputs.cfg = cfg;
  samplerNode.inputs.sampler_name = sampler;
  samplerNode.inputs.seed = seed < 0 ? randomSeed() : seed;

  return workflow;
}

function findNodeByClass(workflow: ComfyWorkflow, classType: string, titleIncludes?: string) {
  return Object.values(workflow).find((node) => {
    if (node.class_type !== classType) {
      return false;
    }

    if (!titleIncludes) {
      return true;
    }

    return node._meta?.title?.toLowerCase().includes(titleIncludes.toLowerCase()) ?? false;
  });
}

function findLinkedNode(workflow: ComfyWorkflow, input: unknown) {
  if (!Array.isArray(input) || typeof input[0] !== 'string') {
    return null;
  }

  return workflow[input[0]] ?? null;
}

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
