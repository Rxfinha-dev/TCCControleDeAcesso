namespace TCCControleDeAcesso.Views
{
    partial class frmMainMenu
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.label2 = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.panel1 = new System.Windows.Forms.Panel();
            this.btnVoltar = new System.Windows.Forms.Button();
            this.btnLog = new System.Windows.Forms.Button();
            this.btnConfig = new System.Windows.Forms.Button();
            this.btnSair = new System.Windows.Forms.Button();
            this.btnAluno = new System.Windows.Forms.Button();
            this.btnCurso = new System.Windows.Forms.Button();
            this.btnVerificao = new System.Windows.Forms.Button();
            this.button5 = new System.Windows.Forms.Button();
            this.panel2 = new System.Windows.Forms.Panel();
            this.pictureBox2 = new System.Windows.Forms.PictureBox();
            this.pictureBox3 = new System.Windows.Forms.PictureBox();
            this.contentPanel = new System.Windows.Forms.Panel();
            this.flowCards = new System.Windows.Forms.FlowLayoutPanel();
            this.cardVerificacao = new System.Windows.Forms.Panel();
            this.pbVerificacao = new System.Windows.Forms.PictureBox();
            this.lblCardVerificacao = new System.Windows.Forms.Label();
            this.cardCursos = new System.Windows.Forms.Panel();
            this.pbCursos = new System.Windows.Forms.PictureBox();
            this.lblCardCursos = new System.Windows.Forms.Label();
            this.cardAlunos = new System.Windows.Forms.Panel();
            this.pbAlunos = new System.Windows.Forms.PictureBox();
            this.lblCardAlunos = new System.Windows.Forms.Label();
            this.cardEntradas = new System.Windows.Forms.Panel();
            this.pbEntradas = new System.Windows.Forms.PictureBox();
            this.lblCardEntradas = new System.Windows.Forms.Label();
            this.cardConfig = new System.Windows.Forms.Panel();
            this.pbConfig = new System.Windows.Forms.PictureBox();
            this.lblCardConfig = new System.Windows.Forms.Label();
            this.lblWelcome = new System.Windows.Forms.Label();
            this.lblTagline = new System.Windows.Forms.Label();
            this.panel1.SuspendLayout();
            this.panel2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox2)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox3)).BeginInit();
            this.contentPanel.SuspendLayout();
            this.flowCards.SuspendLayout();
            this.cardVerificacao.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbVerificacao)).BeginInit();
            this.cardCursos.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbCursos)).BeginInit();
            this.cardAlunos.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbAlunos)).BeginInit();
            this.cardEntradas.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbEntradas)).BeginInit();
            this.cardConfig.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbConfig)).BeginInit();
            this.SuspendLayout();
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Arial", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.ForeColor = System.Drawing.Color.Blue;
            this.label2.Location = new System.Drawing.Point(63, 122);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(109, 18);
            this.label2.TabIndex = 24;
            this.label2.Text = "ProjetoTcc123";
            this.label2.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
           
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(78, 103);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(79, 19);
            this.label1.TabIndex = 23;
            this.label1.Text = "Usuário: ";
            this.label1.Click += new System.EventHandler(this.label1_Click);
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.SystemColors.ButtonHighlight;
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
            this.panel1.Controls.Add(this.btnVoltar);
            this.panel1.Controls.Add(this.btnLog);
            this.panel1.Controls.Add(this.btnConfig);
            this.panel1.Controls.Add(this.btnSair);
            this.panel1.Controls.Add(this.btnAluno);
            this.panel1.Controls.Add(this.btnCurso);
            this.panel1.Controls.Add(this.btnVerificao);
            this.panel1.Controls.Add(this.button5);
            this.panel1.Controls.Add(this.panel2);
            this.panel1.Dock = System.Windows.Forms.DockStyle.Left;
            this.panel1.Location = new System.Drawing.Point(0, 0);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(232, 864);
            this.panel1.TabIndex = 31;
            this.panel1.Paint += new System.Windows.Forms.PaintEventHandler(this.panel1_Paint);
            // 
            // btnVoltar
            // 
            this.btnVoltar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVoltar.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.btnVoltar.FlatAppearance.BorderSize = 0;
            this.btnVoltar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnVoltar.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVoltar.ForeColor = System.Drawing.Color.Black;
            this.btnVoltar.Location = new System.Drawing.Point(0, 666);
            this.btnVoltar.Name = "btnVoltar";
            this.btnVoltar.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.btnVoltar.Size = new System.Drawing.Size(228, 97);
            this.btnVoltar.TabIndex = 40;
            this.btnVoltar.Text = "Voltar";
            this.btnVoltar.UseVisualStyleBackColor = false;
            this.btnVoltar.Click += new System.EventHandler(this.btnVoltar_Click);
            // 
            // btnLog
            // 
            this.btnLog.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnLog.Dock = System.Windows.Forms.DockStyle.Top;
            this.btnLog.FlatAppearance.BorderSize = 0;
            this.btnLog.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnLog.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnLog.ForeColor = System.Drawing.Color.Black;
            this.btnLog.Image = global::TCCControleDeAcesso.Properties.Resources.setting;
            this.btnLog.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnLog.Location = new System.Drawing.Point(0, 467);
            this.btnLog.Name = "btnLog";
            this.btnLog.Size = new System.Drawing.Size(228, 74);
            this.btnLog.TabIndex = 39;
            this.btnLog.Text = "Configurações";
            this.btnLog.UseVisualStyleBackColor = false;
            this.btnLog.Click += new System.EventHandler(this.btnLog_Click);
            // 
            // btnConfig
            // 
            this.btnConfig.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnConfig.Dock = System.Windows.Forms.DockStyle.Top;
            this.btnConfig.FlatAppearance.BorderSize = 0;
            this.btnConfig.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnConfig.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnConfig.ForeColor = System.Drawing.Color.Black;
            this.btnConfig.Image = global::TCCControleDeAcesso.Properties.Resources.search__2_;
            this.btnConfig.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnConfig.Location = new System.Drawing.Point(0, 393);
            this.btnConfig.Name = "btnConfig";
            this.btnConfig.Size = new System.Drawing.Size(228, 74);
            this.btnConfig.TabIndex = 38;
            this.btnConfig.Text = "Entradas";
            this.btnConfig.UseVisualStyleBackColor = false;
            this.btnConfig.Click += new System.EventHandler(this.btnConfig_Click);
            // 
            // btnSair
            // 
            this.btnSair.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnSair.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.btnSair.FlatAppearance.BorderSize = 0;
            this.btnSair.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSair.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSair.ForeColor = System.Drawing.Color.Black;
            this.btnSair.Location = new System.Drawing.Point(0, 763);
            this.btnSair.Name = "btnSair";
            this.btnSair.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.btnSair.Size = new System.Drawing.Size(228, 97);
            this.btnSair.TabIndex = 37;
            this.btnSair.Text = "Sair";
            this.btnSair.UseVisualStyleBackColor = false;
            this.btnSair.Click += new System.EventHandler(this.button8_Click);
            // 
            // btnAluno
            // 
            this.btnAluno.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnAluno.Dock = System.Windows.Forms.DockStyle.Top;
            this.btnAluno.FlatAppearance.BorderSize = 0;
            this.btnAluno.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnAluno.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAluno.ForeColor = System.Drawing.Color.Black;
            this.btnAluno.Image = global::TCCControleDeAcesso.Properties.Resources.student;
            this.btnAluno.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnAluno.Location = new System.Drawing.Point(0, 319);
            this.btnAluno.Name = "btnAluno";
            this.btnAluno.Size = new System.Drawing.Size(228, 74);
            this.btnAluno.TabIndex = 36;
            this.btnAluno.Text = "Alunos";
            this.btnAluno.UseVisualStyleBackColor = false;
            this.btnAluno.Click += new System.EventHandler(this.btnAluno_Click);
            // 
            // btnCurso
            // 
            this.btnCurso.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnCurso.Dock = System.Windows.Forms.DockStyle.Top;
            this.btnCurso.FlatAppearance.BorderSize = 0;
            this.btnCurso.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnCurso.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCurso.ForeColor = System.Drawing.Color.Black;
            this.btnCurso.Image = global::TCCControleDeAcesso.Properties.Resources.open_book;
            this.btnCurso.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnCurso.Location = new System.Drawing.Point(0, 245);
            this.btnCurso.Name = "btnCurso";
            this.btnCurso.Size = new System.Drawing.Size(228, 74);
            this.btnCurso.TabIndex = 35;
            this.btnCurso.Text = "Cursos";
            this.btnCurso.UseVisualStyleBackColor = false;
            this.btnCurso.Click += new System.EventHandler(this.btnCurso_Click);
            // 
            // btnVerificao
            // 
            this.btnVerificao.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVerificao.Dock = System.Windows.Forms.DockStyle.Top;
            this.btnVerificao.FlatAppearance.BorderSize = 0;
            this.btnVerificao.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnVerificao.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerificao.ForeColor = System.Drawing.Color.Black;
            this.btnVerificao.Image = global::TCCControleDeAcesso.Properties.Resources.id;
            this.btnVerificao.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnVerificao.Location = new System.Drawing.Point(0, 171);
            this.btnVerificao.Name = "btnVerificao";
            this.btnVerificao.Size = new System.Drawing.Size(228, 74);
            this.btnVerificao.TabIndex = 34;
            this.btnVerificao.Text = " Verificação";
            this.btnVerificao.UseVisualStyleBackColor = false;
            this.btnVerificao.Click += new System.EventHandler(this.btnVerificao_Click);
            // 
            // button5
            // 
            this.button5.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button5.Dock = System.Windows.Forms.DockStyle.Top;
            this.button5.FlatAppearance.BorderSize = 0;
            this.button5.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button5.Font = new System.Drawing.Font("Nirmala UI", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button5.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(186)))), ((int)(((byte)(240)))));
            this.button5.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.button5.ImageKey = "(nenhum/a)";
            this.button5.Location = new System.Drawing.Point(0, 160);
            this.button5.Name = "button5";
            this.button5.Size = new System.Drawing.Size(228, 11);
            this.button5.TabIndex = 33;
            this.button5.TextImageRelation = System.Windows.Forms.TextImageRelation.ImageBeforeText;
            this.button5.UseVisualStyleBackColor = false;
            this.button5.Click += new System.EventHandler(this.button5_Click);
            // 
            // panel2
            // 
            this.panel2.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.panel2.Controls.Add(this.label1);
            this.panel2.Controls.Add(this.pictureBox2);
            this.panel2.Controls.Add(this.label2);
            this.panel2.Dock = System.Windows.Forms.DockStyle.Top;
            this.panel2.Location = new System.Drawing.Point(0, 0);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(228, 160);
            this.panel2.TabIndex = 32;
            // 
            // pictureBox2
            // 
            this.pictureBox2.BackColor = System.Drawing.Color.Transparent;
            this.pictureBox2.Image = global::TCCControleDeAcesso.Properties.Resources.UserIP;
            this.pictureBox2.Location = new System.Drawing.Point(56, 13);
            this.pictureBox2.Name = "pictureBox2";
            this.pictureBox2.Size = new System.Drawing.Size(118, 102);
            this.pictureBox2.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pictureBox2.TabIndex = 32;
            this.pictureBox2.TabStop = false;
            this.pictureBox2.Click += new System.EventHandler(this.pictureBox2_Click);
            // 
            // pictureBox3
            // 
            this.pictureBox3.Image = global::TCCControleDeAcesso.Properties.Resources.Texto_do_seu_parágrafo1;
            this.pictureBox3.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.pictureBox3.Location = new System.Drawing.Point(900, 140);
            this.pictureBox3.Name = "pictureBox3";
            this.pictureBox3.Size = new System.Drawing.Size(642, 637);
            this.pictureBox3.TabIndex = 46;
            this.pictureBox3.TabStop = false;
            // 
            // contentPanel
            // 
            this.contentPanel.BackColor = System.Drawing.Color.White;
            this.contentPanel.Controls.Add(this.flowCards);
            this.contentPanel.Controls.Add(this.lblTagline);
            this.contentPanel.Controls.Add(this.lblWelcome);
            this.contentPanel.Controls.Add(this.pictureBox3);
            this.contentPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.contentPanel.Location = new System.Drawing.Point(232, 0);
            this.contentPanel.Name = "contentPanel";
            this.contentPanel.Padding = new System.Windows.Forms.Padding(24);
            this.contentPanel.Size = new System.Drawing.Size(1407, 864);
            this.contentPanel.TabIndex = 47;
            // 
            // flowCards
            // 
            this.flowCards.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.flowCards.AutoScroll = true;
            this.flowCards.BackColor = System.Drawing.Color.White;
            this.flowCards.Controls.Add(this.cardVerificacao);
            this.flowCards.Controls.Add(this.cardCursos);
            this.flowCards.Controls.Add(this.cardAlunos);
            this.flowCards.Controls.Add(this.cardEntradas);
            this.flowCards.Controls.Add(this.cardConfig);
            this.flowCards.Location = new System.Drawing.Point(28, 160);
            this.flowCards.Name = "flowCards";
            this.flowCards.Padding = new System.Windows.Forms.Padding(4);
            this.flowCards.Size = new System.Drawing.Size(850, 620);
            this.flowCards.TabIndex = 51;
            // 
            // cardVerificacao
            // 
            this.cardVerificacao.BackColor = System.Drawing.Color.White;
            this.cardVerificacao.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.cardVerificacao.Controls.Add(this.lblCardVerificacao);
            this.cardVerificacao.Controls.Add(this.pbVerificacao);
            this.cardVerificacao.Cursor = System.Windows.Forms.Cursors.Hand;
            this.cardVerificacao.Margin = new System.Windows.Forms.Padding(10);
            this.cardVerificacao.Name = "cardVerificacao";
            this.cardVerificacao.Size = new System.Drawing.Size(240, 130);
            this.cardVerificacao.TabIndex = 0;
            this.cardVerificacao.Click += new System.EventHandler(this.cardVerificacao_Click);
            // 
            // pbVerificacao
            // 
            this.pbVerificacao.Image = global::TCCControleDeAcesso.Properties.Resources.id;
            this.pbVerificacao.Location = new System.Drawing.Point(16, 32);
            this.pbVerificacao.Name = "pbVerificacao";
            this.pbVerificacao.Size = new System.Drawing.Size(56, 56);
            this.pbVerificacao.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pbVerificacao.TabIndex = 1;
            this.pbVerificacao.TabStop = false;
            this.pbVerificacao.Click += new System.EventHandler(this.cardVerificacao_Click);
            // 
            // lblCardVerificacao
            // 
            this.lblCardVerificacao.AutoSize = true;
            this.lblCardVerificacao.Font = new System.Drawing.Font("Arial", 14F, System.Drawing.FontStyle.Bold);
            this.lblCardVerificacao.ForeColor = System.Drawing.Color.Black;
            this.lblCardVerificacao.Location = new System.Drawing.Point(88, 52);
            this.lblCardVerificacao.Name = "lblCardVerificacao";
            this.lblCardVerificacao.Size = new System.Drawing.Size(111, 22);
            this.lblCardVerificacao.TabIndex = 2;
            this.lblCardVerificacao.Text = "Verificação";
            this.lblCardVerificacao.Click += new System.EventHandler(this.cardVerificacao_Click);
            // 
            // cardCursos
            // 
            this.cardCursos.BackColor = System.Drawing.Color.White;
            this.cardCursos.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.cardCursos.Controls.Add(this.lblCardCursos);
            this.cardCursos.Controls.Add(this.pbCursos);
            this.cardCursos.Cursor = System.Windows.Forms.Cursors.Hand;
            this.cardCursos.Margin = new System.Windows.Forms.Padding(10);
            this.cardCursos.Name = "cardCursos";
            this.cardCursos.Size = new System.Drawing.Size(240, 130);
            this.cardCursos.TabIndex = 1;
            this.cardCursos.Click += new System.EventHandler(this.cardCursos_Click);
            // 
            // pbCursos
            // 
            this.pbCursos.Image = global::TCCControleDeAcesso.Properties.Resources.open_book;
            this.pbCursos.Location = new System.Drawing.Point(16, 32);
            this.pbCursos.Name = "pbCursos";
            this.pbCursos.Size = new System.Drawing.Size(56, 56);
            this.pbCursos.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pbCursos.TabIndex = 1;
            this.pbCursos.TabStop = false;
            this.pbCursos.Click += new System.EventHandler(this.cardCursos_Click);
            // 
            // lblCardCursos
            // 
            this.lblCardCursos.AutoSize = true;
            this.lblCardCursos.Font = new System.Drawing.Font("Arial", 14F, System.Drawing.FontStyle.Bold);
            this.lblCardCursos.ForeColor = System.Drawing.Color.Black;
            this.lblCardCursos.Location = new System.Drawing.Point(88, 52);
            this.lblCardCursos.Name = "lblCardCursos";
            this.lblCardCursos.Size = new System.Drawing.Size(74, 22);
            this.lblCardCursos.TabIndex = 2;
            this.lblCardCursos.Text = "Cursos";
            this.lblCardCursos.Click += new System.EventHandler(this.cardCursos_Click);
            // 
            // cardAlunos
            // 
            this.cardAlunos.BackColor = System.Drawing.Color.White;
            this.cardAlunos.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.cardAlunos.Controls.Add(this.lblCardAlunos);
            this.cardAlunos.Controls.Add(this.pbAlunos);
            this.cardAlunos.Cursor = System.Windows.Forms.Cursors.Hand;
            this.cardAlunos.Margin = new System.Windows.Forms.Padding(10);
            this.cardAlunos.Name = "cardAlunos";
            this.cardAlunos.Size = new System.Drawing.Size(240, 130);
            this.cardAlunos.TabIndex = 2;
            this.cardAlunos.Click += new System.EventHandler(this.cardAlunos_Click);
            // 
            // pbAlunos
            // 
            this.pbAlunos.Image = global::TCCControleDeAcesso.Properties.Resources.student;
            this.pbAlunos.Location = new System.Drawing.Point(16, 32);
            this.pbAlunos.Name = "pbAlunos";
            this.pbAlunos.Size = new System.Drawing.Size(56, 56);
            this.pbAlunos.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pbAlunos.TabIndex = 1;
            this.pbAlunos.TabStop = false;
            this.pbAlunos.Click += new System.EventHandler(this.cardAlunos_Click);
            // 
            // lblCardAlunos
            // 
            this.lblCardAlunos.AutoSize = true;
            this.lblCardAlunos.Font = new System.Drawing.Font("Arial", 14F, System.Drawing.FontStyle.Bold);
            this.lblCardAlunos.ForeColor = System.Drawing.Color.Black;
            this.lblCardAlunos.Location = new System.Drawing.Point(88, 52);
            this.lblCardAlunos.Name = "lblCardAlunos";
            this.lblCardAlunos.Size = new System.Drawing.Size(77, 22);
            this.lblCardAlunos.TabIndex = 2;
            this.lblCardAlunos.Text = "Alunos";
            this.lblCardAlunos.Click += new System.EventHandler(this.cardAlunos_Click);
            // 
            // cardEntradas
            // 
            this.cardEntradas.BackColor = System.Drawing.Color.White;
            this.cardEntradas.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.cardEntradas.Controls.Add(this.lblCardEntradas);
            this.cardEntradas.Controls.Add(this.pbEntradas);
            this.cardEntradas.Cursor = System.Windows.Forms.Cursors.Hand;
            this.cardEntradas.Margin = new System.Windows.Forms.Padding(10);
            this.cardEntradas.Name = "cardEntradas";
            this.cardEntradas.Size = new System.Drawing.Size(240, 130);
            this.cardEntradas.TabIndex = 3;
            this.cardEntradas.Click += new System.EventHandler(this.cardEntradas_Click);
            // 
            // pbEntradas
            // 
            this.pbEntradas.Image = global::TCCControleDeAcesso.Properties.Resources.ver_lista;
            this.pbEntradas.Location = new System.Drawing.Point(16, 32);
            this.pbEntradas.Name = "pbEntradas";
            this.pbEntradas.Size = new System.Drawing.Size(56, 56);
            this.pbEntradas.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pbEntradas.TabIndex = 1;
            this.pbEntradas.TabStop = false;
            this.pbEntradas.Click += new System.EventHandler(this.cardEntradas_Click);
            // 
            // lblCardEntradas
            // 
            this.lblCardEntradas.AutoSize = true;
            this.lblCardEntradas.Font = new System.Drawing.Font("Arial", 14F, System.Drawing.FontStyle.Bold);
            this.lblCardEntradas.ForeColor = System.Drawing.Color.Black;
            this.lblCardEntradas.Location = new System.Drawing.Point(88, 52);
            this.lblCardEntradas.Name = "lblCardEntradas";
            this.lblCardEntradas.Size = new System.Drawing.Size(95, 22);
            this.lblCardEntradas.TabIndex = 2;
            this.lblCardEntradas.Text = "Entradas";
            this.lblCardEntradas.Click += new System.EventHandler(this.cardEntradas_Click);
            // 
            // cardConfig
            // 
            this.cardConfig.BackColor = System.Drawing.Color.White;
            this.cardConfig.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.cardConfig.Controls.Add(this.lblCardConfig);
            this.cardConfig.Controls.Add(this.pbConfig);
            this.cardConfig.Cursor = System.Windows.Forms.Cursors.Hand;
            this.cardConfig.Margin = new System.Windows.Forms.Padding(10);
            this.cardConfig.Name = "cardConfig";
            this.cardConfig.Size = new System.Drawing.Size(240, 130);
            this.cardConfig.TabIndex = 4;
            this.cardConfig.Click += new System.EventHandler(this.cardConfig_Click);
            // 
            // pbConfig
            // 
            this.pbConfig.Image = global::TCCControleDeAcesso.Properties.Resources.setting;
            this.pbConfig.Location = new System.Drawing.Point(16, 32);
            this.pbConfig.Name = "pbConfig";
            this.pbConfig.Size = new System.Drawing.Size(56, 56);
            this.pbConfig.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.pbConfig.TabIndex = 1;
            this.pbConfig.TabStop = false;
            this.pbConfig.Click += new System.EventHandler(this.cardConfig_Click);
            // 
            // lblCardConfig
            // 
            this.lblCardConfig.AutoSize = true;
            this.lblCardConfig.Font = new System.Drawing.Font("Arial", 14F, System.Drawing.FontStyle.Bold);
            this.lblCardConfig.ForeColor = System.Drawing.Color.Black;
            this.lblCardConfig.Location = new System.Drawing.Point(88, 52);
            this.lblCardConfig.Name = "lblCardConfig";
            this.lblCardConfig.Size = new System.Drawing.Size(149, 22);
            this.lblCardConfig.TabIndex = 2;
            this.lblCardConfig.Text = "Configurações";
            this.lblCardConfig.Click += new System.EventHandler(this.cardConfig_Click);
            // 
            // lblWelcome
            // 
            this.lblWelcome.AutoSize = true;
            this.lblWelcome.Font = new System.Drawing.Font("Arial", 24F, System.Drawing.FontStyle.Bold);
            this.lblWelcome.ForeColor = System.Drawing.Color.Black;
            this.lblWelcome.Location = new System.Drawing.Point(24, 48);
            this.lblWelcome.Name = "lblWelcome";
            this.lblWelcome.Size = new System.Drawing.Size(386, 37);
            this.lblWelcome.TabIndex = 48;
            this.lblWelcome.Text = "Bem-vindo ao HelpUs";
            // 
            // lblTagline
            // 
            this.lblTagline.AutoSize = true;
            this.lblTagline.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular);
            this.lblTagline.ForeColor = System.Drawing.Color.FromArgb(52, 188, 251);
            this.lblTagline.Location = new System.Drawing.Point(28, 96);
            this.lblTagline.Name = "lblTagline";
            this.lblTagline.Size = new System.Drawing.Size(332, 18);
            this.lblTagline.TabIndex = 49;
            this.lblTagline.Text = "Gerencie acessos com rapidez e segurança";
            // 
            // frmMainMenu
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoSize = true;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_Sem_Nome___1___Editado1;
            this.ClientSize = new System.Drawing.Size(1639, 864);
            this.Controls.Add(this.contentPanel);
            this.Controls.Add(this.panel1);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "frmMainMenu";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Load += new System.EventHandler(this.frmMainMenu_Load);
            this.panel1.ResumeLayout(false);
            this.panel2.ResumeLayout(false);
            this.panel2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox2)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox3)).EndInit();
            this.contentPanel.ResumeLayout(false);
            this.contentPanel.PerformLayout();
            this.flowCards.ResumeLayout(false);
            this.cardVerificacao.ResumeLayout(false);
            this.cardVerificacao.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbVerificacao)).EndInit();
            this.cardCursos.ResumeLayout(false);
            this.cardCursos.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbCursos)).EndInit();
            this.cardAlunos.ResumeLayout(false);
            this.cardAlunos.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbAlunos)).EndInit();
            this.cardEntradas.ResumeLayout(false);
            this.cardEntradas.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbEntradas)).EndInit();
            this.cardConfig.ResumeLayout(false);
            this.cardConfig.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbConfig)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Panel panel2;
        private System.Windows.Forms.PictureBox pictureBox2;
        private System.Windows.Forms.Button btnSair;
        private System.Windows.Forms.Button btnAluno;
        private System.Windows.Forms.Button btnCurso;
        private System.Windows.Forms.Button btnVerificao;
        private System.Windows.Forms.Button btnConfig;
        private System.Windows.Forms.Button button5;
        private System.Windows.Forms.PictureBox pictureBox3;
        private System.Windows.Forms.Button btnLog;
        private System.Windows.Forms.Button btnVoltar;
        private System.Windows.Forms.Panel contentPanel;
        private System.Windows.Forms.Label lblWelcome;
        private System.Windows.Forms.Label lblTagline;
        private System.Windows.Forms.FlowLayoutPanel flowCards;
        private System.Windows.Forms.Panel cardVerificacao;
        private System.Windows.Forms.PictureBox pbVerificacao;
        private System.Windows.Forms.Label lblCardVerificacao;
        private System.Windows.Forms.Panel cardCursos;
        private System.Windows.Forms.PictureBox pbCursos;
        private System.Windows.Forms.Label lblCardCursos;
        private System.Windows.Forms.Panel cardAlunos;
        private System.Windows.Forms.PictureBox pbAlunos;
        private System.Windows.Forms.Label lblCardAlunos;
        private System.Windows.Forms.Panel cardEntradas;
        private System.Windows.Forms.PictureBox pbEntradas;
        private System.Windows.Forms.Label lblCardEntradas;
        private System.Windows.Forms.Panel cardConfig;
        private System.Windows.Forms.PictureBox pbConfig;
        private System.Windows.Forms.Label lblCardConfig;
    }
}