
import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, Shield, Download, Lock, RefreshCw, ShieldAlert, FileCode, ScanLine, QrCode, Gavel, Handshake } from 'lucide-react';
import Header from './components/Header';
import Button from './components/Button';
import StatusTerminal from './components/StatusTerminal';
import BiometricAuth from './components/BiometricAuth';
import MetadataViewer from './components/MetadataViewer';
import ForensicPanel from './components/ForensicPanel';
import QRCodeModal from './components/QRCodeModal';
import ReportConfigModal from './components/ReportConfigModal';
import { calculateHashes } from './services/cryptoService';
import { stampPdf, generateAuditReport, generateJudicialReport, generateSettlementReport } from './services/pdfService';
import { extractMetadata } from './services/metadataService';
import { generateWhitePaper } from './services/whitepaperService';
import { connectWallet, mintEvidenceNFT, resolveWeb3Error, Web3ErrorDetail } from './services/web3Service';
import { AppStep, ForensicData, WalletState, TradingReportData } from './types';
import { ethers } from 'ethers';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.IDLE);
  const [fileData, setFileData] = useState<ForensicData | null>(null);
  const [wallet, setWallet] = useState<WalletState>({ address: null, isConnected: false, chainId: null });
  const [walletSigner, setWalletSigner] = useState<ethers.Signer | null>(null);
  const [logs, setLogs] = useState<{id: number, text: string, type: 'info'|'success'|'warning'|'error'}[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [certifiedPdfUrl, setCertifiedPdfUrl] = useState<string | null>(null);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Reporting Modal State
  const [showReportConfig, setShowReportConfig] = useState(false);
  const [reportType, setReportType] = useState<'JUDICIAL' | 'SETTLEMENT'>('JUDICIAL');
  
  const [errorDetails, setErrorDetails] = useState<Web3ErrorDetail | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Force Dark Mode for God Mode Aesthetic
    document.documentElement.classList.add('dark');
    localStorage.setItem('lex-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // Theme toggle disabled in God Mode to maintain aesthetic
    setIsDarkMode(true);
  };

  const addLog = (text: string, type: 'info'|'success'|'warning'|'error' = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), text, type }]);
  };

  const handleError = (error: any) => {
    console.error(error);
    let details: Web3ErrorDetail;

    if (error.code || error.info || (error.message && (error.message.includes("MetaMask") || error.message.includes("wallet")))) {
       details = resolveWeb3Error(error);
    } else {
       details = {
         title: "Operation Failed",
         description: error.message || "An unexpected system error occurred.",
         solution: "Please check your file and try again."
       };
    }
    
    setErrorDetails(details);
    addLog(`${details.title}: ${details.description}`, "error");
  };

  const handleWalletConnect = async () => {
    setErrorDetails(null);
    try {
      addLog("Initializing Web3 handshake protocol...", "info");
      
      const { address, chainId, signer } = await connectWallet();
      
      setWallet({ address, isConnected: true, chainId });
      setWalletSigner(signer);
      
      addLog(`Wallet Identity Verified: ${address}`, "success");
      addLog(`Network Detected: Chain ID ${chainId}`, "info");
    } catch (error: any) {
      handleError(error);
      setWallet({ address: null, isConnected: false, chainId: null });
      setWalletSigner(null);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    setErrorDetails(null);

    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    if (file.size > MAX_SIZE_BYTES) {
        setErrorDetails({
          title: "Storage Capacity Exceeded",
          description: `The file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the ${MAX_SIZE_MB}MB safety limit.`,
          solution: "Please compress the file or split it into smaller evidence packets."
        });
        return;
    }
    
    setCertifiedPdfUrl(null);
    setTxHash(null);
    setLogs([]); // Clear previous logs
    
    setStep(AppStep.ANALYZING);
    addLog(`Ingesting Evidence: ${file.name} [${(file.size/1024).toFixed(2)} KB]`, "info");
    addLog("Mounting Virtual File System...", "info");
    addLog("Starting Client-Side Cryptographic Hashing...", "warning");

    try {
      // START PROCESSING IMMEDIATELY
      const processingPromise = calculateHashes(file);
      
      // Run visual delay concurrently (God Mode aesthetic)
      const animationPromise = new Promise(r => setTimeout(r, 1500));
      
      const [hashResult] = await Promise.all([processingPromise, animationPromise]);
      const { sha256, sha512, arrayBuffer } = hashResult;
      
      // Extract Metadata
      addLog("Extracting File Metadata...", "info");
      const metadata = await extractMetadata(file, arrayBuffer);
      
      // Simulated Forensic Steps for effect
      await new Promise(r => setTimeout(r, 500));
      addLog("Running Entropy Analysis (Shannon Algorithm)...", "info");
      await new Promise(r => setTimeout(r, 500));
      addLog("Scanning for Steganographic Injections...", "info");
      
      const data: ForensicData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified,
        hashSHA256: sha256,
        hashSHA512: sha512,
        timestamp: new Date().toUTCString(),
        originalBuffer: arrayBuffer,
        metadata: metadata
      };

      setFileData(data);
      addLog(`SHA-256: ${sha256.substring(0, 16)}...`, "success");
      addLog(`SHA-512: ${sha512.substring(0, 16)}...`, "success");
      addLog("Integrity Check Passed. No Anomalies Detected.", "success");
      setStep(AppStep.REVIEW);
    } catch (error: any) {
      handleError(error);
      setStep(AppStep.IDLE);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleCertification = async () => {
    if (!fileData) return;
    setErrorDetails(null);
    
    // Trigger Biometric Auth
    setIsBiometricScanning(true);
    addLog("Requesting Biometric Authorization...", "warning");
    
    // Simulate Biometric Delay
    await new Promise(r => setTimeout(r, 2500));
    
    setIsBiometricScanning(false);
    setStep(AppStep.PROCESSING);
    addLog("Identity Confirmed. Access Granted.", "success");
    addLog("Initializing Digital Stamping Engine...", "info");

    try {
      let stampedPdfBytes: Uint8Array;
      
      if (fileData.fileType === 'application/pdf') {
        addLog("Injecting Visual Watermarks & Metadata...", "info");
        stampedPdfBytes = await stampPdf(fileData, wallet.address);
      } else {
        addLog("Non-PDF detected. Generating standard forensic wrapper...", "warning");
        stampedPdfBytes = new Uint8Array(fileData.originalBuffer); 
      }

      const blob = new Blob([stampedPdfBytes], { type: fileData.fileType === 'application/pdf' ? 'application/pdf' : fileData.fileType });
      const url = URL.createObjectURL(blob);
      setCertifiedPdfUrl(url);

      addLog("Digital Seal Applied Successfully.", "success");
      setStep(AppStep.CERTIFIED);

    } catch (error: any) {
      handleError(error);
      setStep(AppStep.REVIEW);
    }
  };

  const handleMinting = async () => {
    setErrorDetails(null);
    if (!wallet.isConnected || !walletSigner) {
      setErrorDetails({
        title: "Authentication Required",
        description: "A connected Web3 wallet is required to sign the blockchain transaction.",
        solution: "Click the 'Connect Wallet' button in the top right corner."
      });
      await handleWalletConnect();
      return;
    }
    if (!fileData) return;

    try {
      addLog("Constructing Blockchain Transaction...", "info");
      addLog("Requesting User Signature...", "warning");
      
      const result = await mintEvidenceNFT(fileData.hashSHA256, walletSigner);
      
      setTxHash(result.txHash);
      
      addLog("Transaction Broadcasted to Network.", "success");
      addLog(`Evidence Immutable ID: ${result.txHash.substring(0,20)}...`, "success");
      addLog("PROOF OF EXISTENCE CONFIRMED.", "success");
      
    } catch (error: any) {
      handleError(error);
    }
  };

  const downloadAuditReport = async () => {
    if (!fileData) return;
    addLog("Generating Forensic Audit Report...", "info");
    try {
      const reportBytes = await generateAuditReport(fileData, txHash);
      const blob = new Blob([reportBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AUDIT_REPORT_${fileData.fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog("Report Downloaded.", "success");
    } catch (error: any) {
        handleError(error);
    }
  };

  const downloadWhitePaper = async () => {
    if (!fileData) return;
    addLog("Compiling Technical White Paper...", "info");
    try {
      const wpBytes = await generateWhitePaper(fileData.fileName, fileData.hashSHA256);
      const blob = new Blob([wpBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WHITE_PAPER_ARCH_${fileData.fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog("White Paper Generated.", "success");
    } catch (error: any) {
      handleError(error);
    }
  };

  const openReportConfig = (type: 'JUDICIAL' | 'SETTLEMENT') => {
      setReportType(type);
      setShowReportConfig(true);
  };

  const handleGenerateSpecializedReport = async (reportData: TradingReportData) => {
    setShowReportConfig(false);
    if (!fileData) return;
    
    const title = reportType === 'JUDICIAL' ? 'Judicial Peritaje' : 'Settlement Agreement';
    addLog(`Generating Specialized Report: ${title}...`, "info");
    
    try {
        let bytes: Uint8Array;
        const walletAddr = wallet.address || "0x0000000000000000000000000000000000000000";
        
        if (reportType === 'JUDICIAL') {
            bytes = await generateJudicialReport(fileData, walletAddr, reportData);
        } else {
            bytes = await generateSettlementReport(fileData, walletAddr, reportData);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_REPORT_${fileData.fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addLog(`${title} Generated Successfully.`, "success");

    } catch (error: any) {
        handleError(error);
    }
  };

  const reset = () => {
    setStep(AppStep.IDLE);
    setFileData(null);
    setLogs([]);
    setTxHash(null);
    setCertifiedPdfUrl(null);
    setErrorDetails(null);
    setShowMetadata(false);
    setShowQRModal(false);
  };

  return (
    <div className="min-h-screen bg-lexBlack text-gray-300 selection:bg-lexRed selection:text-white font-sans pb-20 relative overflow-hidden">
      
      {/* GLOBAL OVERLAYS */}
      <div className="scanline"></div>
      {isBiometricScanning && <BiometricAuth />}
      {showMetadata && fileData && fileData.metadata && (
        <MetadataViewer metadata={fileData.metadata} onClose={() => setShowMetadata(false)} />
      )}
      {showQRModal && fileData && (
        <QRCodeModal hash={fileData.hashSHA256} onClose={() => setShowQRModal(false)} />
      )}
      {showReportConfig && (
        <ReportConfigModal 
            type={reportType} 
            onClose={() => setShowReportConfig(false)} 
            onSubmit={handleGenerateSpecializedReport} 
        />
      )}
      
      <Header wallet={wallet} onConnect={handleWalletConnect} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* ERROR MODAL SYSTEM */}
      {errorDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full bg-[#050505] border border-lexRed shadow-[0_0_30px_rgba(220,38,38,0.3)] p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-lexRed animate-pulse"></div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-lexRed/10 rounded-full border border-lexRed/30 shrink-0">
                <ShieldAlert className="w-8 h-8 text-lexRed animate-pulse" />
              </div>
              <div className="space-y-2 flex-1">
                 <h3 className="text-xl font-serif text-lexRed tracking-wide uppercase text-glow">{errorDetails.title}</h3>
                 <p className="text-sm font-mono text-gray-400 border-l-2 border-lexRed/30 pl-3 py-1">
                   {errorDetails.description}
                 </p>
                 {errorDetails.solution && (
                   <div className="mt-4 bg-white/5 p-3 rounded border border-white/10">
                      <p className="text-[10px] text-lexGold uppercase tracking-widest mb-1">Recommended Action:</p>
                      <p className="text-xs text-gray-300">{errorDetails.solution}</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="danger" onClick={() => setErrorDetails(null)} className="text-xs py-2 px-4">
                ACKNOWLEDGE ALERT
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-28 max-w-7xl mx-auto px-4 relative z-10">
        
        {/* HERO SECTION */}
        {step === AppStep.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
             <div className="w-32 h-32 border border-lexGold/30 rounded-full flex items-center justify-center relative animate-pulse-fast">
                <div className="absolute inset-0 bg-lexGold blur-[60px] opacity-20 rounded-full"></div>
                <div className="absolute inset-2 border border-lexGold/10 rounded-full border-dashed animate-spin duration-[10s]"></div>
                <Shield className="w-12 h-12 text-lexGold text-glow" />
             </div>
             
             <div className="space-y-4 max-w-3xl">
               <h2 className="text-5xl md:text-6xl font-serif text-white tracking-widest uppercase text-glow">
                 Lex Sentinel <span className="text-lexGold text-[0.5em] align-top">PROTOCOL OMEGA</span>
               </h2>
               <p className="text-lexSilver font-mono text-sm tracking-wider uppercase border-t-2 border-b-2 border-white/5 py-4 inline-block">
                 Military-Grade Forensic Evidence Certification Terminal
               </p>
             </div>

             <div 
               onDragOver={handleDragOver}
               onDrop={handleDrop}
               className="w-full max-w-xl h-64 border border-dashed border-gray-700 hover:border-lexGold bg-black/50 hover:bg-lexGold/5 rounded-none transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer group backdrop-blur-sm relative overflow-hidden"
               onClick={() => fileInputRef.current?.click()}
             >
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
               <div className="absolute top-0 left-0 p-2 text-[9px] font-mono text-gray-600">INPUT_STREAM_V.2.0</div>
               <Upload className="w-12 h-12 text-gray-600 group-hover:text-lexGold transition-colors" />
               <div className="text-center relative z-10">
                 <p className="text-white font-mono uppercase tracking-widest group-hover:text-lexGold transition-colors">Initialize Evidence Uplink</p>
                 <p className="text-[10px] text-gray-500 mt-2 font-mono">DRAG FILE OR CLICK TO BROWSE SYSTEM</p>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileInput} 
               />
             </div>
             
             <div className="flex gap-8 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
               <span className="flex items-center gap-2"><Lock className="w-3 h-3 text-lexGreen" /> AES-256 ENCRYPTION</span>
               <span className="flex items-center gap-2"><ScanLine className="w-3 h-3 text-lexGreen" /> ENTROPY ANALYSIS</span>
             </div>
          </div>
        )}

        {/* PROCESSING & DASHBOARD */}
        {step !== AppStep.IDLE && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pb-20">
            
            {/* LEFT COLUMN: FORENSIC CYBERDECK */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <FileCode className="w-4 h-4 text-lexGold" />
                 <h3 className="text-white font-serif tracking-widest text-sm">FORENSIC DECK // {fileData?.fileName}</h3>
              </div>

              {/* INTEGRATED MULTI-VIEW PANEL */}
              <ForensicPanel 
                data={fileData} 
                onShowMetadata={() => setShowMetadata(true)} 
              />

              <StatusTerminal logs={logs} step={step} isWalletConnected={wallet.isConnected} />
            </div>

            {/* RIGHT COLUMN: ACTIONS */}
            <div className="space-y-6">
              
              {/* STAGE 1: CERTIFY */}
              <div className={`border rounded p-6 transition-all duration-500 relative overflow-hidden ${step === AppStep.REVIEW ? 'bg-black/60 border-lexGold shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'bg-black/30 border-gray-800 opacity-50'}`}>
                {step === AppStep.REVIEW && <div className="absolute top-0 left-0 w-1 h-full bg-lexGold"></div>}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold font-serif border ${step >= AppStep.REVIEW ? 'bg-lexGold text-black border-lexGold' : 'bg-transparent text-gray-500 border-gray-800'}`}>01</div>
                  <h3 className="font-serif text-lg text-white uppercase tracking-widest">Digital Seal & Timestamp</h3>
                </div>
                
                <div className="pl-12">
                   <p className="text-xs font-mono text-gray-500 mb-6">
                     Apply X.509 compliant digital signature. Embeds forensic hash, UTC atomic timestamp, and verification QR code.
                   </p>
                   {certifiedPdfUrl ? (
                     <div className="flex gap-4 animate-fade-in flex-col sm:flex-row">
                       <a href={certifiedPdfUrl} download={`CERTIFIED_${fileData?.fileName}`} className="flex-1">
                          <Button variant="secondary" className="w-full text-xs border-lexGreen text-lexGreen hover:bg-lexGreen/10">
                             <Download className="w-4 h-4 inline mr-2" /> DOWNLOAD SECURE COPY
                          </Button>
                       </a>
                       <Button 
                         variant="secondary" 
                         onClick={() => setShowQRModal(true)}
                         className="flex-shrink-0 text-xs px-4 border-lexGold text-lexGold hover:bg-lexGold/10"
                       >
                         <QrCode className="w-4 h-4 inline mr-2" /> VIEW QR
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       onClick={handleCertification} 
                       disabled={step !== AppStep.REVIEW}
                       isLoading={step === AppStep.PROCESSING}
                       className="w-full"
                     >
                       INITIATE SEALING PROTOCOL
                     </Button>
                   )}
                </div>
              </div>

              {/* STAGE 2: BLOCKCHAIN */}
              <div className={`border rounded p-6 transition-all duration-500 relative ${step === AppStep.CERTIFIED ? 'bg-black/60 border-lexGold shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'bg-black/30 border-gray-800 opacity-50'}`}>
                {step === AppStep.CERTIFIED && <div className="absolute top-0 left-0 w-1 h-full bg-lexGold"></div>}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold font-serif border ${step >= AppStep.CERTIFIED && txHash ? 'bg-lexGold text-black border-lexGold' : (step >= AppStep.CERTIFIED ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800')}`}>02</div>
                  <h3 className="font-serif text-lg text-white uppercase tracking-widest">Blockchain Anchor</h3>
                </div>
                
                <div className="pl-12">
                   <p className="text-xs font-mono text-gray-500 mb-6">
                     Mint "Proof of Existence" NFT on Ethereum. Creates immutable, censorship-resistant record.
                   </p>
                   {txHash ? (
                     <div className="bg-lexGreen/10 border border-lexGreen/30 p-4 rounded mb-4 animate-fade-in">
                        <p className="text-lexGreen text-xs font-mono mb-2 flex items-center gap-2"><CheckCircle className="w-3 h-3"/> EVIDENCE ANCHORED</p>
                        <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-white underline break-all font-mono">
                          {txHash}
                        </a>
                        <div className="mt-2 text-[10px] text-gray-500 font-mono">
                           VERIFY: https://lex-sentinel.io/verify/{fileData?.hashSHA256.substring(0,8)}...
                        </div>
                     </div>
                   ) : (
                     <Button 
                       onClick={handleMinting}
                       disabled={step !== AppStep.CERTIFIED || !!txHash}
                       variant="primary"
                       className="w-full"
                     >
                       MINT EVIDENCE TOKEN (NFT)
                     </Button>
                   )}
                </div>
              </div>

              {/* STAGE 3: AUDIT & WHITE PAPER */}
              {txHash && (
                 <div className="border border-lexGold/30 bg-lexGold/5 rounded p-6 animate-fade-in relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-lexGold/10">
                        <FileCode className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-8 h-8 border border-lexGold bg-lexGold text-black flex items-center justify-center font-bold font-serif">03</div>
                      <h3 className="font-serif text-lg text-white uppercase tracking-widest">Final Audit Package</h3>
                    </div>
                    <div className="pl-12 flex flex-col gap-3 relative z-10">
                       <div className="flex gap-2">
                           <Button onClick={downloadAuditReport} variant="secondary" className="flex-1">
                             <FileCode className="w-4 h-4 inline mr-2" /> STANDARD AUDIT CERTIFICATE
                           </Button>
                           <Button 
                             onClick={() => setShowQRModal(true)}
                             variant="secondary" 
                             className="px-4 border-lexGold text-lexGold hover:bg-lexGold/10"
                             title="Show Verification QR"
                           >
                              <QrCode className="w-4 h-4" />
                           </Button>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3 mt-2">
                           <Button onClick={() => openReportConfig('JUDICIAL')} variant="secondary" className="text-[10px] bg-black/40 border-lexRed/50 hover:border-lexRed text-lexRed/80 hover:text-lexRed">
                             <Gavel className="w-3 h-3 inline mr-2" /> JUDICIAL REPORT
                           </Button>
                           <Button onClick={() => openReportConfig('SETTLEMENT')} variant="secondary" className="text-[10px] bg-black/40 border-blue-500/50 hover:border-blue-500 text-blue-400/80 hover:text-blue-400">
                             <Handshake className="w-3 h-3 inline mr-2" /> SETTLEMENT DOC
                           </Button>
                       </div>

                       <Button onClick={downloadWhitePaper} variant="secondary" className="mt-2">
                         <ScanLine className="w-4 h-4 inline mr-2" /> GENERATE TECH WHITE PAPER
                       </Button>

                       <Button onClick={reset} variant="secondary" className="border-none text-gray-500 hover:text-white mt-4 bg-transparent hover:bg-transparent">
                         <RefreshCw className="w-4 h-4 inline mr-2" /> RESET TERMINAL
                       </Button>
                    </div>
                 </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
