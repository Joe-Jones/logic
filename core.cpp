#include <stdio.h>
#include <list>
#include <stdlib.h>

using namespace std;

#define ALLOCATOR_PAGE_SIZE 1024

class BitAllocator {
public:
	
	BitAllocator() {
		offset_into_page = 1024;
		current_page = memory.begin();
	};
	
	~BitAllocator() {
		for(list<unsigned int*>::iterator page = memory.begin(); page != memory.end(); page++) {
			free(*page);
		}
	}
	
	unsigned int *getBits() {
		unsigned int *word = getNext();
		if (!word) {
			current_page++;
			offset_into_page = 0;
			if (current_page == memory.end()) {
				unsigned int *new_page = (unsigned int *) calloc(ALLOCATOR_PAGE_SIZE, sizeof(unsigned int));
				memory.push_back(new_page);
				current_page = memory.end();
				current_page --;
			}
			word = (*current_page) + offset_into_page++;
		}
		return word;
	};
	
	/* getNext is allowed to return NULL, however if it does
	   a new page is allocated next time getBits is called */
	unsigned int *getNext() {
		if (offset_into_page == ALLOCATOR_PAGE_SIZE) {
			return NULL;
		}
		return (*current_page) + offset_into_page++;
	};
	
private:
	list<unsigned int*> memory;
	list<unsigned int*>::iterator current_page;
	int offset_into_page;
};

struct VectorPart {
public:
	VectorPart(unsigned int offset,	int size, unsigned int *bits) { this->start =  start;	this->size = size; this->bits = bits; };
	unsigned int start;
	int size;
	unsigned int *bits;
};

class VectorReader {
public:
	
	VectorReader(list<VectorPart> &vector) {
		iter = vector.begin();
		end = vector.end();
	};
	
	unsigned int *read(unsigned int address) {
		while (iter != end) {
			if (address < iter->start + iter->size) {
				return &(iter->bits[address - iter->start]);
			}
			iter++;
		}
		return NULL;
	};
	
private:
	list<VectorPart>::iterator iter, end;
};

class VectorBuilder {
public:
	VectorBuilder(list<VectorPart> &build_into, BitAllocator &allocator) : vector(build_into), allocator(allocator) {
		next_address = 0;
		start_of_current_part = 0;
		current_bits = NULL;
	};
	
	void write(unsigned int address, unsigned int value) {
		if (address > next_address) {
			startNewPart(address);
		}
		unsigned int *new_word;
		if ((new_word = allocator.getNext()) == NULL) {
			startNewPart(address);
			new_word = allocator.getBits();
		}
		if (current_bits == NULL) {
			current_bits = new_word;
		}
		*new_word = value;
		next_address = address + 1;
	}
	
	void finish() {
		startNewPart(0);
	}
	
private:
	
	void startNewPart(unsigned int new_address) {
		vector.push_back(VectorPart(start_of_current_part, next_address - start_of_current_part, current_bits));
		start_of_current_part = next_address = new_address;
		current_bits = NULL;
	};
	
	BitAllocator &allocator;
	list<VectorPart> &vector;
	unsigned int next_address;
	unsigned int start_of_current_part;
	unsigned int *current_bits;
};

void VAnd(list<VectorPart> &output, list<VectorPart> &left, list<VectorPart> &right) {
	if (left.empty() || right.empty()) {
		return;
	}
	VectorReader right_reader(right);
	for(list<VectorPart>::iterator left_iter = left.begin(); left_iter != left.end(); left_iter++) {
		for (int i = 0; i < left_iter->size; i++) {
			
		}
	}
}

class BitVector {
	
	
};

class ConnectionMatrix {
	
};


int main() {
	int a = 0;
	printf("Hi there %d\n", a++);
}
