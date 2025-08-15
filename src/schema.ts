import { makeExecutableSchema } from '@graphql-tools/schema';

// GraphQL Type Definitions
const typeDefs = `
  type Query {
    hello: String
    chat(message: String!): ChatResponse
  }

  type Mutation {
    sendMessage(input: MessageInput!): ChatResponse
  }

  type ChatResponse {
    id: String!
    message: String!
    timestamp: String!
    model: String!
  }

  input MessageInput {
    message: String!
    conversationId: String
    model: String
  }

  type Conversation {
    id: String!
    messages: [ChatMessage!]!
    createdAt: String!
    updatedAt: String!
  }

  type ChatMessage {
    id: String!
    role: String!
    content: String!
    timestamp: String!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from AI Chat Service!',
    chat: async (_: any, { message }: { message: string }, context: any) => {
      // This will be implemented with ChatGPT integration
      return {
        id: generateId(),
        message: `Echo: ${message}`,
        timestamp: new Date().toISOString(),
        model: 'gpt-3.5-turbo'
      };
    }
  },
  Mutation: {
    sendMessage: async (_: any, { input }: { input: any }, context: any) => {
      // This will integrate with ChatGPT API
      const { chatService } = context;
      
      try {
        const response = await chatService.sendMessage(input.message, {
          conversationId: input.conversationId,
          model: input.model || 'gpt-3.5-turbo'
        });
        
        return {
          id: generateId(),
          message: response,
          timestamp: new Date().toISOString(),
          model: input.model || 'gpt-3.5-turbo'
        };
      } catch (error) {
        throw new Error(`Chat service error: ${error}`);
      }
    }
  }
};

// Utility function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Create and export the executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

export { typeDefs, resolvers };