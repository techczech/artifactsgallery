import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/card';
import { AlertCircle, BookOpen, Hash, Grid, Search } from 'lucide-react';

const TextAnalysisTool = () => {
  const [text, setText] = useState('');
  const [wordFrequency, setWordFrequency] = useState([]);
  const [collocations, setCollocations] = useState([]);
  const [sentenceData, setSentenceData] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [kwicResults, setKwicResults] = useState([]);
  const [activeTab, setActiveTab] = useState('word-frequency');
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const colors = {
    primary: '#7c3aed',
    secondary: '#ec4899',
    tertiary: '#f59e0b',
    quaternary: '#10b981',
    background: '#f8fafc',
    text: '#1e293b',
    highlight: '#fef3c7'
  };

  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 
    'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down', 
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 
    'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 
    'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 
    'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 
    'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 
    'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  // Function to analyze text
  const analyzeText = () => {
    if (!text.trim()) return;
    
    // Word frequency analysis
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word && !stopWords.has(word));
    
    const frequency = _.countBy(words);
    const wordFreqData = Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    setWordFrequency(wordFreqData);
    
    // Collocation analysis
    const bigramMap = {};
    for (let i = 0; i < words.length - 1; i++) {
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        bigramMap[bigram] = (bigramMap[bigram] || 0) + 1;
      }
    }
    
    const bigramData = Object.entries(bigramMap)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    setCollocations(bigramData);
    
    // Sentence analysis
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .filter(sentence => sentence.trim().length > 0);
    
    const sentenceLengths = sentences.map((sentence, index) => {
      const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
      return { 
        index: index + 1, 
        sentence: sentence.trim(), 
        wordCount 
      };
    });
    
    setSentenceData(sentenceLengths);
    
    setIsAnalyzed(true);
    
    // Initial KWIC for the first top word if it exists
    if (wordFreqData.length > 0) {
      findKeywordInContext(wordFreqData[0].word);
    }
  };
  
  // Keywords in Context (KWIC)
  const findKeywordInContext = (keyword) => {
    if (!keyword) {
      setKwicResults([]);
      return;
    }
    
    setKeywordSearch(keyword);
    
    // Handle phrases (collocations) or single words
    const isPhrase = keyword.includes(' ');
    let regex;
    
    if (isPhrase) {
      // For exact phrase matching
      regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    } else {
      // For single word matching
      regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    }
    
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|");
    
    const results = [];
    
    sentences.forEach(sentence => {
      if (regex.test(sentence)) {
        // Reset the regex since we used the test method
        regex.lastIndex = 0;
        
        // Find all matches
        let match;
        while ((match = regex.exec(sentence)) !== null) {
          const matchedText = match[0];
          const start = Math.max(0, match.index - 40);
          const end = Math.min(sentence.length, match.index + matchedText.length + 40);
          
          let context = sentence.substring(start, end);
          
          // Add ellipsis if we cut the sentence
          if (start > 0) context = '...' + context;
          if (end < sentence.length) context = context + '...';
          
          // Format to highlight the keyword
          const matchIndex = context.toLowerCase().indexOf(matchedText.toLowerCase());
          const beforeKeyword = context.substring(0, matchIndex);
          const keywordText = context.substring(
            matchIndex, 
            matchIndex + matchedText.length
          );
          const afterKeyword = context.substring(matchIndex + matchedText.length);
          
          results.push({
            before: beforeKeyword,
            keyword: keywordText,
            after: afterKeyword
          });
        }
      }
    });
    
    setKwicResults(results);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl p-4 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>Text Analysis Tool</h1>
        <p className="text-gray-600">Understand your writing with detailed analysis of word frequency, collocations, and context</p>
      </div>
      
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here for analysis..."
          className="w-full p-3 border border-gray-300 rounded-md h-40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={analyzeText}
            className="px-4 py-2 rounded-md text-white font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            Analyze Text
          </button>
        </div>
      </div>
      
      {isAnalyzed && (
        <Tabs defaultValue="word-frequency" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger 
              value="word-frequency" 
              className="flex items-center gap-2"
              style={{ color: activeTab === 'word-frequency' ? colors.primary : colors.text }}
            >
              <Hash size={18} />
              <span>Word Frequency</span>
            </TabsTrigger>
            <TabsTrigger 
              value="collocations" 
              className="flex items-center gap-2"
              style={{ color: activeTab === 'collocations' ? colors.secondary : colors.text }}
            >
              <Grid size={18} />
              <span>Collocations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kwic" 
              className="flex items-center gap-2"
              style={{ color: activeTab === 'kwic' ? colors.tertiary : colors.text }}
            >
              <Search size={18} />
              <span>Keywords in Context</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sentences" 
              className="flex items-center gap-2"
              style={{ color: activeTab === 'sentences' ? colors.quaternary : colors.text }}
            >
              <BookOpen size={18} />
              <span>Sentences</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="word-frequency" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ backgroundColor: `${colors.primary}10` }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
                Most Frequent Words
              </h2>
              
              {wordFrequency.length > 0 ? (
                <>
                  <div className="h-72 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={wordFrequency.slice(0, 10)}
                        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="word" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70} 
                          tick={{ fill: colors.text, fontSize: 12 }} 
                        />
                        <YAxis tick={{ fill: colors.text }} />
                        <Tooltip 
                          formatter={(value) => [`${value} occurrences`, 'Frequency']} 
                          labelFormatter={(value) => `Word: ${value}`}
                          contentStyle={{ backgroundColor: colors.background }}
                        />
                        <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {wordFrequency.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          findKeywordInContext(item.word);
                          setActiveTab('kwic');
                        }}
                        className="px-3 py-2 rounded-md text-sm flex justify-between items-center hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: `${colors.primary}20`,
                          borderLeft: `4px solid ${colors.primary}`
                        }}
                      >
                        <span className="font-medium">{item.word}</span>
                        <span className="bg-white px-2 rounded-full text-xs" style={{ color: colors.primary }}>
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">No word frequency data available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="collocations" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ backgroundColor: `${colors.secondary}10` }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.secondary }}>
                Common Word Pairs
              </h2>
              
              {collocations.length > 0 ? (
                <>
                  <div className="h-72 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={collocations.slice(0, 10)}
                        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fill: colors.text }} />
                        <YAxis 
                          type="category" 
                          dataKey="phrase" 
                          width={150}
                          tick={{ fill: colors.text, fontSize: 12 }} 
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} occurrences`, 'Frequency']} 
                          labelFormatter={(value) => `Phrase: ${value}`}
                          contentStyle={{ backgroundColor: colors.background }}
                        />
                        <Bar dataKey="count" fill={colors.secondary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {collocations.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          findKeywordInContext(item.phrase);
                          setActiveTab('kwic');
                        }}
                        className="px-3 py-2 rounded-md text-sm flex justify-between items-center hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: `${colors.secondary}15`,
                          borderLeft: `4px solid ${colors.secondary}`,
                          textAlign: 'left',
                          width: '100%'
                        }}
                      >
                        <span className="font-medium">{item.phrase}</span>
                        <span className="bg-white px-2 rounded-full text-xs" style={{ color: colors.secondary }}>
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">No collocation data available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="kwic" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ backgroundColor: `${colors.tertiary}10` }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.tertiary }}>
                Keywords in Context
              </h2>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    placeholder="Search for a keyword or phrase..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ focusRing: colors.tertiary }}
                  />
                  <button
                    onClick={() => findKeywordInContext(keywordSearch)}
                    className="px-4 py-2 rounded-md text-white"
                    style={{ backgroundColor: colors.tertiary }}
                  >
                    Search
                  </button>
                </div>
                
                <div className="mb-2 mt-4">
                  <h3 className="text-sm font-medium mb-1" style={{ color: colors.tertiary }}>Popular Words</h3>
                  <div className="flex flex-wrap gap-2">
                    {wordFrequency.slice(0, 5).map((item, index) => (
                      <button
                        key={`word-${index}`}
                        onClick={() => findKeywordInContext(item.word)}
                        className="px-2 py-1 rounded-md text-xs hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: keywordSearch === item.word ? colors.tertiary : `${colors.tertiary}20`,
                          color: keywordSearch === item.word ? 'white' : colors.text
                        }}
                      >
                        {item.word}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="text-sm font-medium mb-1" style={{ color: colors.secondary }}>Popular Phrases</h3>
                  <div className="flex flex-wrap gap-2">
                    {collocations.slice(0, 3).map((item, index) => (
                      <button
                        key={`collocation-${index}`}
                        onClick={() => findKeywordInContext(item.phrase)}
                        className="px-2 py-1 rounded-md text-xs hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: keywordSearch === item.phrase ? colors.secondary : `${colors.secondary}20`,
                          color: keywordSearch === item.phrase ? 'white' : colors.text
                        }}
                      >
                        "{item.phrase}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {kwicResults.length > 0 ? (
                <ScrollArea className="h-96 rounded-md border p-4">
                  <div className="space-y-3">
                    {kwicResults.map((result, index) => (
                      <div key={index} className="p-3 rounded-md bg-white shadow-sm">
                        <p>
                          <span>{result.before}</span>
                          <span className="font-bold rounded px-1" style={{ backgroundColor: colors.highlight }}>
                            {result.keyword}
                          </span>
                          <span>{result.after}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                  <AlertCircle size={24} />
                  <p>No matches found. Try a different keyword.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sentences" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ backgroundColor: `${colors.quaternary}10` }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.quaternary }}>
                Sentence Analysis
              </h2>
              
              {sentenceData.length > 0 ? (
                <>
                  <div className="h-72 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sentenceData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="index" 
                          tick={{ fill: colors.text }} 
                          label={{ value: 'Sentence Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          tick={{ fill: colors.text }} 
                          label={{ value: 'Word Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} words`, 'Length']} 
                          labelFormatter={(value) => `Sentence ${value}`}
                          contentStyle={{ backgroundColor: colors.background }}
                        />
                        <Bar dataKey="wordCount" fill={colors.quaternary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <ScrollArea className="h-64 rounded-md border p-4">
                    <div className="space-y-3">
                      {sentenceData.map((item, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-md bg-white shadow-sm flex gap-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: colors.quaternary }}>
                            {item.index}
                          </div>
                          <div>
                            <p>{item.sentence}</p>
                            <p className="text-xs mt-1 text-gray-500">
                              {item.wordCount} words
                              {item.wordCount > 25 && 
                                <span className="ml-2 px-1 rounded text-white" style={{ backgroundColor: colors.tertiary }}>
                                  Long sentence
                                </span>
                              }
                              {item.wordCount < 5 && 
                                <span className="ml-2 px-1 rounded text-white" style={{ backgroundColor: colors.secondary }}>
                                  Short sentence
                                </span>
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">No sentence data available</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {!isAnalyzed && (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BookOpen size={40} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">Ready to analyze your text</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Paste your essay or article in the text area above and click "Analyze Text" to see detailed insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default TextAnalysisTool;