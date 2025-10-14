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
            this.panel1.SuspendLayout();
            this.panel2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox2)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox3)).BeginInit();
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
            this.label2.Click += new System.EventHandler(this.label2_Click);
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
            this.pictureBox3.Location = new System.Drawing.Point(1177, 214);
            this.pictureBox3.Name = "pictureBox3";
            this.pictureBox3.Size = new System.Drawing.Size(642, 637);
            this.pictureBox3.TabIndex = 46;
            this.pictureBox3.TabStop = false;
            // 
            // frmMainMenu
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoSize = true;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_Sem_Nome___1___Editado1;
            this.ClientSize = new System.Drawing.Size(1639, 864);
            this.Controls.Add(this.pictureBox3);
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
    }
}