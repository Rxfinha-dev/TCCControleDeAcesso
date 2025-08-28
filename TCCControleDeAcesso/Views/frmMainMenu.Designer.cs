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
            this.btnLogout = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.btnConfiguracoes = new System.Windows.Forms.Button();
            this.btnVerificacao = new System.Windows.Forms.Button();
            this.btnCursos = new System.Windows.Forms.Button();
            this.btnAlunos = new System.Windows.Forms.Button();
            this.panel1 = new System.Windows.Forms.Panel();
            this.button1 = new System.Windows.Forms.Button();
            this.button8 = new System.Windows.Forms.Button();
            this.button7 = new System.Windows.Forms.Button();
            this.button6 = new System.Windows.Forms.Button();
            this.button3 = new System.Windows.Forms.Button();
            this.button5 = new System.Windows.Forms.Button();
            this.panel2 = new System.Windows.Forms.Panel();
            this.pictureBox2 = new System.Windows.Forms.PictureBox();
            this.pictureBox1 = new System.Windows.Forms.PictureBox();
            this.panel1.SuspendLayout();
            this.panel2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox2)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).BeginInit();
            this.SuspendLayout();
            // 
            // btnLogout
            // 
            this.btnLogout.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnLogout.Font = new System.Drawing.Font("Arial", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnLogout.Location = new System.Drawing.Point(53, 690);
            this.btnLogout.Name = "btnLogout";
            this.btnLogout.Size = new System.Drawing.Size(117, 56);
            this.btnLogout.TabIndex = 25;
            this.btnLogout.Text = "Sair";
            this.btnLogout.UseVisualStyleBackColor = false;
            this.btnLogout.Click += new System.EventHandler(this.btnLogout_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Arial", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.ForeColor = System.Drawing.Color.Blue;
            this.label2.Location = new System.Drawing.Point(61, 123);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(109, 18);
            this.label2.TabIndex = 24;
            this.label2.Text = "ProjetoTcc123";
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
            // 
            // btnConfiguracoes
            // 
            this.btnConfiguracoes.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnConfiguracoes.Font = new System.Drawing.Font("Arial", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnConfiguracoes.Location = new System.Drawing.Point(3, 603);
            this.btnConfiguracoes.Name = "btnConfiguracoes";
            this.btnConfiguracoes.Size = new System.Drawing.Size(223, 81);
            this.btnConfiguracoes.TabIndex = 26;
            this.btnConfiguracoes.Text = "Configurações";
            this.btnConfiguracoes.UseVisualStyleBackColor = false;
            this.btnConfiguracoes.Click += new System.EventHandler(this.btnConfiguracoes_Click);
            // 
            // btnVerificacao
            // 
            this.btnVerificacao.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVerificacao.Font = new System.Drawing.Font("Arial", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerificacao.Location = new System.Drawing.Point(26, 494);
            this.btnVerificacao.Name = "btnVerificacao";
            this.btnVerificacao.Size = new System.Drawing.Size(223, 81);
            this.btnVerificacao.TabIndex = 27;
            this.btnVerificacao.Text = "Verificacão";
            this.btnVerificacao.UseVisualStyleBackColor = false;
            this.btnVerificacao.Click += new System.EventHandler(this.btnVerificacao_Click);
            // 
            // btnCursos
            // 
            this.btnCursos.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnCursos.Font = new System.Drawing.Font("Arial", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCursos.Location = new System.Drawing.Point(-2, 544);
            this.btnCursos.Name = "btnCursos";
            this.btnCursos.Size = new System.Drawing.Size(223, 81);
            this.btnCursos.TabIndex = 28;
            this.btnCursos.Text = "Cursos";
            this.btnCursos.UseVisualStyleBackColor = false;
            this.btnCursos.Click += new System.EventHandler(this.btnCursos_Click);
            // 
            // btnAlunos
            // 
            this.btnAlunos.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnAlunos.Font = new System.Drawing.Font("Arial", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAlunos.Location = new System.Drawing.Point(0, 653);
            this.btnAlunos.Name = "btnAlunos";
            this.btnAlunos.Size = new System.Drawing.Size(223, 81);
            this.btnAlunos.TabIndex = 29;
            this.btnAlunos.Text = "Alunos";
            this.btnAlunos.UseVisualStyleBackColor = false;
            this.btnAlunos.Click += new System.EventHandler(this.btnAlunos_Click);
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.SystemColors.ButtonHighlight;
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
            this.panel1.Controls.Add(this.button1);
            this.panel1.Controls.Add(this.button8);
            this.panel1.Controls.Add(this.btnLogout);
            this.panel1.Controls.Add(this.btnVerificacao);
            this.panel1.Controls.Add(this.btnAlunos);
            this.panel1.Controls.Add(this.btnConfiguracoes);
            this.panel1.Controls.Add(this.button7);
            this.panel1.Controls.Add(this.btnCursos);
            this.panel1.Controls.Add(this.button6);
            this.panel1.Controls.Add(this.button3);
            this.panel1.Controls.Add(this.button5);
            this.panel1.Controls.Add(this.panel2);
            this.panel1.Dock = System.Windows.Forms.DockStyle.Left;
            this.panel1.Location = new System.Drawing.Point(0, 0);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(232, 841);
            this.panel1.TabIndex = 31;
            this.panel1.Paint += new System.Windows.Forms.PaintEventHandler(this.panel1_Paint);
            // 
            // button1
            // 
            this.button1.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button1.Dock = System.Windows.Forms.DockStyle.Top;
            this.button1.FlatAppearance.BorderSize = 0;
            this.button1.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button1.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button1.ForeColor = System.Drawing.Color.Black;
            this.button1.Image = global::TCCControleDeAcesso.Properties.Resources.setting;
            this.button1.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.button1.Location = new System.Drawing.Point(0, 393);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(228, 74);
            this.button1.TabIndex = 38;
            this.button1.Text = "Configurações";
            this.button1.UseVisualStyleBackColor = false;
            // 
            // button8
            // 
            this.button8.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button8.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.button8.FlatAppearance.BorderSize = 0;
            this.button8.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button8.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button8.ForeColor = System.Drawing.Color.Black;
            this.button8.Location = new System.Drawing.Point(0, 740);
            this.button8.Name = "button8";
            this.button8.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.button8.Size = new System.Drawing.Size(228, 97);
            this.button8.TabIndex = 37;
            this.button8.Text = "Sair";
            this.button8.UseVisualStyleBackColor = false;
            this.button8.Click += new System.EventHandler(this.button8_Click);
            // 
            // button7
            // 
            this.button7.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button7.Dock = System.Windows.Forms.DockStyle.Top;
            this.button7.FlatAppearance.BorderSize = 0;
            this.button7.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button7.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button7.ForeColor = System.Drawing.Color.Black;
            this.button7.Image = global::TCCControleDeAcesso.Properties.Resources.student;
            this.button7.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.button7.Location = new System.Drawing.Point(0, 319);
            this.button7.Name = "button7";
            this.button7.Size = new System.Drawing.Size(228, 74);
            this.button7.TabIndex = 36;
            this.button7.Text = "Alunos";
            this.button7.UseVisualStyleBackColor = false;            // 
            // button6
            // 
            this.button6.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button6.Dock = System.Windows.Forms.DockStyle.Top;
            this.button6.FlatAppearance.BorderSize = 0;
            this.button6.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button6.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button6.ForeColor = System.Drawing.Color.Black;
            this.button6.Image = global::TCCControleDeAcesso.Properties.Resources.open_book;
            this.button6.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.button6.Location = new System.Drawing.Point(0, 245);
            this.button6.Name = "button6";
            this.button6.Size = new System.Drawing.Size(228, 74);
            this.button6.TabIndex = 35;
            this.button6.Text = "Cursos";
            this.button6.UseVisualStyleBackColor = false;            // 
            // button3
            // 
            this.button3.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.button3.Dock = System.Windows.Forms.DockStyle.Top;
            this.button3.FlatAppearance.BorderSize = 0;
            this.button3.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.button3.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.button3.ForeColor = System.Drawing.Color.Black;
            this.button3.Image = global::TCCControleDeAcesso.Properties.Resources.id;
            this.button3.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.button3.Location = new System.Drawing.Point(0, 171);
            this.button3.Name = "button3";
            this.button3.Size = new System.Drawing.Size(228, 74);
            this.button3.TabIndex = 34;
            this.button3.Text = " Verificação";
            this.button3.UseVisualStyleBackColor = false;            // 
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
            // 
            // pictureBox1
            // 
            this.pictureBox1.Image = global::TCCControleDeAcesso.Properties.Resources._13;
            this.pictureBox1.Location = new System.Drawing.Point(229, 0);
            this.pictureBox1.Name = "pictureBox1";
            this.pictureBox1.Size = new System.Drawing.Size(1429, 1357);
            this.pictureBox1.TabIndex = 32;
            this.pictureBox1.TabStop = false;
            // 
            // frmMainMenu
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoSize = true;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__11_;
            this.ClientSize = new System.Drawing.Size(1639, 841);
            this.Controls.Add(this.pictureBox1);
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
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button btnLogout;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btnConfiguracoes;
        private System.Windows.Forms.Button btnVerificacao;
        private System.Windows.Forms.Button btnCursos;
        private System.Windows.Forms.Button btnAlunos;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Panel panel2;
        private System.Windows.Forms.PictureBox pictureBox2;
        private System.Windows.Forms.Button button8;
        private System.Windows.Forms.Button button7;
        private System.Windows.Forms.Button button6;
        private System.Windows.Forms.Button button3;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Button button5;
        private System.Windows.Forms.PictureBox pictureBox1;
    }
}