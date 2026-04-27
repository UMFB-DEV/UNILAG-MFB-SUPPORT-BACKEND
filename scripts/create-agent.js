const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAgent() {
  try {
    const agentData = {
      email: 'agent@ticketing.com',
      password: 'agent123',
      role: 'agent',
      department: 'Technical Support'
    };

    // Check if agent already exists
    const existingAgent = await prisma.user.findUnique({
      where: { email: agentData.email }
    });

    if (existingAgent) {
      console.log('Agent user already exists:', agentData.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(agentData.password, 10);

    // Create agent
    const agent = await prisma.user.create({
      data: {
        ...agentData,
        password: hashedPassword
      }
    });

    console.log('Agent created successfully:');
    console.log('Email:', agent.email);
    console.log('Password:', agentData.password);
    console.log('Role:', agent.role);
    console.log('Department:', agent.department);
    
  } catch (error) {
    console.error('Error creating agent:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAgent();
