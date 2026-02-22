import React, { useState } from 'react';
import { render, Text, Box, Newline } from 'ink';
import TextInput from 'ink-text-input';
import { runAgent, Agent, AgentStatus } from 'octopus';
import { v4 as uuidv4 } from 'uuid';

function OctopusTUI() {
  const [prompt, setPrompt] = useState('');
  const [llm, setLlm] = useState('mock'); // For now, only mock is supported
  const [agentStatus, setAgentStatus] = useState<string>('Idle');
  const [output, setOutput] = useState<string[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setOutput(prev => [...prev, 'Error: Prompt cannot be empty.']);
      return;
    }

    setIsAgentRunning(true);
    setAgentStatus('Running...');
    setOutput([]); // Clear previous output

    const agent: Agent = {
      id: uuidv4(),
      prompt: prompt,
      llm: llm,
      status: AgentStatus.IDLE, // This will be updated by runAgent

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOutput(prev => [...prev, `Creating agent ${agent.id} with prompt: "${agent.prompt}"`]);

    try {
      // Temporarily redirect console logs to our output
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args) => {
        setOutput(prev => [...prev, args.join(' ')]);
        // originalLog(...args); // Uncomment to also log to actual console
      };
      console.error = (...args) => {
        setOutput(prev => [...prev, `Error: ${args.join(' ')}`]);
        // originalError(...args); // Uncomment to also log to actual console
      };

      await runAgent(agent);
      setAgentStatus(agent.status); // Update with final status

      console.log = originalLog;
      console.error = originalError;

    } catch (error: any) {
      setAgentStatus('Failed');
      setOutput(prev => [...prev, `Agent failed: ${error.message}`]);
    } finally {
      setIsAgentRunning(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>Octopus AI Agent Manager</Text>
      <Newline />

      <Box flexDirection="row">
        <Text bold>Prompt:</Text>
        <Box width={50} marginLeft={1}>
          <TextInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            placeholder="Enter agent's task here..."
          />
        </Box>
      </Box>
      <Box flexDirection="row">
        <Text bold>LLM (mock only):</Text>
        <Box width={50} marginLeft={1}>
          <TextInput
            value={llm}
            onChange={setLlm}
            onSubmit={handleSubmit}
            placeholder="mock"
          />
        </Box>
      </Box>
      <Newline />
      <Text>Agent Status: <Text color="yellow">{agentStatus}</Text></Text>
      <Newline />

      <Box flexDirection="column" borderStyle="single" padding={1} width="100%">
        <Text bold>Output:</Text>
        {output.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}

export function launchOctopusTUI() {
  render(<OctopusTUI />);
}
